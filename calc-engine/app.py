import os
import time

from flask import Flask, Response, request as flask_request, g
from flask_cors import CORS

from validate_env import validate as _validate_env
_validate_env()

from services.logger import get_logger, configure_stdlib_logging
configure_stdlib_logging()
log = get_logger("app")

from routes.calculate import calc_bp
from routes.pdf       import pdf_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(calc_bp)
app.register_blueprint(pdf_bp)

log.info("calc_engine_started", extra={
    "env": os.environ.get("FLASK_ENV", "development")
})


# ── Config reload ─────────────────────────────────────────────────────
import signal as _signal
from services.excel_reader import reload_config as _reload_config

def _sighup_handler(signum, frame):
    log.info("sighup_received")
    try:
        _reload_config()
        log.info("sighup_reload_ok")
    except Exception as exc:
        log.error("sighup_reload_failed", extra={"error": str(exc)})

# SIGHUP is Unix-only — skip on Windows
if hasattr(_signal, "SIGHUP"):
    _signal.signal(_signal.SIGHUP, _sighup_handler)


@app.post("/reload-config")
def reload_config_endpoint():
    admin_secret = os.environ.get("ADMIN_SECRET", "")
    if not admin_secret or flask_request.headers.get("X-Admin-Secret") != admin_secret:
        return {"error": "Forbidden"}, 403
    try:
        _reload_config()
        return {"ok": True, "message": "Config reloaded"}, 200
    except Exception as exc:
        log.error("reload_config_failed", extra={"error": str(exc)})
        return {"error": str(exc)}, 500


# ── Request timing ────────────────────────────────────────────────────
@app.before_request
def _start_timer():
    g._req_start   = time.time()
    g._request_id  = flask_request.headers.get("X-Request-ID", "")


@app.after_request
def _log_request(response):
    try:
        duration_ms = (time.time() - g._req_start) * 1000
        level       = "error" if response.status_code >= 500 else (
                      "warn"  if response.status_code >= 400 else "info")
        log.info("http_request", extra={
            "request_id":  getattr(g, "_request_id", ""),
            "method":      flask_request.method,
            "path":        flask_request.path,
            "status":      response.status_code,
            "duration_ms": round(duration_ms, 1),
        })
        if getattr(g, "_request_id", ""):
            response.headers["X-Request-ID"] = g._request_id
    except Exception:
        pass
    return response


# ── Health ────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "calc-engine"}, 200


# ── Readiness ─────────────────────────────────────────────────────────
@app.get("/ready")
def ready():
    import importlib
    checks = {}
    all_ok = True

    try:
        import weasyprint
        checks["weasyprint"] = {"ok": True}
    except Exception as exc:
        checks["weasyprint"] = {"ok": False, "error": str(exc)}
        all_ok = False

    try:
        pdf_dir = os.environ.get("PDF_DIR", "./pdfs")
        os.makedirs(pdf_dir, exist_ok=True)
        test_file = os.path.join(pdf_dir, ".write_test")
        with open(test_file, "w") as f:
            f.write("ok")
        os.remove(test_file)
        checks["pdf_dir"] = {"ok": True}
    except Exception as exc:
        checks["pdf_dir"] = {"ok": False, "error": str(exc)}
        all_ok = False

    excel_path = os.environ.get("EXCEL_PATH", "./excel/solar_calc.xlsx")
    if os.path.isfile(excel_path):
        checks["excel"] = {"ok": True}
    else:
        checks["excel"] = {
            "ok":      True,
            "warning": f"Excel not found at {excel_path} — using fallback tables",
        }

    status_code = 200 if all_ok else 503
    return (
        {
            "status":  "ready" if all_ok else "degraded",
            "service": "calc-engine",
            "checks":  checks,
        },
        status_code,
    )


if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=5000, debug=debug)