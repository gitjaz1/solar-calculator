from flask import Blueprint, request, jsonify
from services.solar_calc import calculate
from services.logger import get_logger

log = get_logger("routes.calculate")

calc_bp = Blueprint("calculate", __name__)


@calc_bp.post("/calculate")
def run_calculate():
    try:
        data = request.get_json(force=True, silent=True)

        if not data:
            return jsonify({"error": "Invalid JSON body"}), 400

        zones   = data.get("zones")
        project = data.get("project")

        if not zones or not isinstance(zones, list):
            return jsonify({"error": "zones must be a non-empty array"}), 400

        if not project or not isinstance(project, dict):
            return jsonify({"error": "project must be an object"}), 400

        log.info("calculate_start", extra={
            "zones":   len(zones),
            "country": project.get("country"),
            "cc":      project.get("consequenceClass"),
            "wind":    project.get("basicWindVelocity"),
        })

        result = calculate(zones, project)

        log.info("calculate_done", extra={
            "total_shelters": result["total_shelters"],
            "total_tiles":    result["total_tiles"],
        })

        return jsonify(result), 200

    except KeyError as exc:
        log.warning("calculate_missing_field", extra={"field": str(exc)})
        return jsonify({"error": f"Missing required field: {exc}"}), 400

    except Exception as exc:
        log.error("calculate_error", extra={"error": str(exc)})
        return jsonify({"error": "Calculation failed", "detail": str(exc)}), 500