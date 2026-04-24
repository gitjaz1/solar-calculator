from flask import Blueprint, request, jsonify, Response
from services.pdf_service import generate_pdf
from services.logger import get_logger

log = get_logger("routes.pdf")

pdf_bp = Blueprint("pdf", __name__)


@pdf_bp.post("/pdf/generate")
def generate():
    try:
        data = request.get_json(force=True, silent=True)

        if not data:
            return jsonify({"error": "Invalid JSON body"}), 400

        offer_ref   = data.get("offerRef")
        user        = data.get("user")
        project     = data.get("project")
        zones       = data.get("zones")
        calc_result = data.get("calcResult")

        if not all([offer_ref, user, project, zones, calc_result]):
            return jsonify({"error": "Missing required fields"}), 400

        log.info("pdf_generate_start", extra={
            "offer_ref": offer_ref,
            "email":     user.get("email"),
        })

        pdf_bytes = generate_pdf(
            offer_ref   = offer_ref,
            user        = user,
            project     = project,
            zones       = zones,
            calc_result = calc_result,
        )

        log.info("pdf_generate_done", extra={
            "offer_ref": offer_ref,
            "size_kb":   round(len(pdf_bytes) / 1024, 1),
        })

        return Response(
            pdf_bytes,
            status      = 200,
            mimetype    = "application/pdf",
            headers     = {
                "Content-Disposition": f'attachment; filename="solar-offer-{offer_ref}.pdf"',
                "Content-Length":      str(len(pdf_bytes)),
            }
        )

    except Exception as exc:
        log.error("pdf_generate_error", extra={"error": str(exc)})
        return jsonify({"error": "PDF generation failed", "detail": str(exc)}), 500