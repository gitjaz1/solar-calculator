import os
import multiprocessing

host     = os.environ.get("HOST", "0.0.0.0")
port     = os.environ.get("PORT", "5000")
bind     = f"{host}:{port}"

# 1 worker in production — WeasyPrint and openpyxl are heavy
# and the Bull queue already serialises job throughput
workers  = int(os.environ.get("GUNICORN_WORKERS", "1"))

# Threads per worker — allows concurrent health checks
# while a PDF is being generated
threads  = int(os.environ.get("GUNICORN_THREADS", "2"))

# PDF generation can take up to 60s on large projects
timeout  = int(os.environ.get("GUNICORN_TIMEOUT", "120"))

# Restart workers after this many requests to prevent memory leaks
max_requests          = 200
max_requests_jitter   = 20

# Logging
accesslog  = "-"
errorlog   = "-"
loglevel   = os.environ.get("LOG_LEVEL", "info")

# Preload app — loads WeasyPrint and openpyxl once in the master
# process, workers inherit via copy-on-write
preload_app = True