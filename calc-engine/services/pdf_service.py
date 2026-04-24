import os
from pathlib import Path
from datetime import datetime

from weasyprint import HTML, CSS
from jinja2 import Environment, FileSystemLoader

from .layout_svg import generate_all_zones_svg
from .logger import get_logger

log = get_logger("pdf_service")

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
PDF_DIR       = Path(os.environ.get("PDF_DIR", "/app/pdfs"))


def generate_pdf(
    offer_ref:   str,
    user:        dict,
    project:     dict,
    zones:       list,
    calc_result: dict,
) -> bytes:
    PDF_DIR.mkdir(parents=True, exist_ok=True)

    # ── Generate SVGs ─────────────────────────────────────────────────
    zone_svgs = generate_all_zones_svg(
        zones          = calc_result["zones"],
        tile_thickness = int(project["tileThickness"]),
    )

    # ── Attach SVGs to zone results ───────────────────────────────────
    zones_with_svg = []
    for i, zone in enumerate(calc_result["zones"]):
        zones_with_svg.append({
            **zone,
            "svg": zone_svgs[i] if i < len(zone_svgs) else "",
        })

    # ── Build BOM rows ────────────────────────────────────────────────
    bom_rows = []
    for article, item in calc_result.get("bom", {}).items():
        bom_rows.append({
            "article":     article,
            "description": item["description"],
            "qty":         item["qty"],
            "unit":        item.get("unit", "pcs"),
            "unit_price":  item.get("unit_price", 0.0),
            "line_total":  item.get("line_total", 0.0),
        })

    # ── Template context ──────────────────────────────────────────────
    context = {
        "offer_ref":   offer_ref,
        "generated":   datetime.now().strftime("%d %B %Y"),
        "user":        user,
        "project":     project,
        "zones":       zones_with_svg,
        "calc":        calc_result,
        "bom_rows":    bom_rows,
        "subtotal":    calc_result.get("subtotal",        0.0),
        "discount_pct":    calc_result.get("discount_pct",    0.0),
        "discount_amount": calc_result.get("discount_amount", 0.0),
        "total_price":     calc_result.get("total_price",     0.0),
    }

    # ── Render HTML ───────────────────────────────────────────────────
    env = Environment(
        loader      = FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape  = True,
    )
    env.globals["zip"] = zip

    template = env.get_template("offer.html")
    html_str = template.render(**context)

    # ── Load CSS ──────────────────────────────────────────────────────
    css_path = TEMPLATES_DIR / "offer.css"
    css      = CSS(filename=str(css_path)) if css_path.exists() else None

    # ── Render PDF ────────────────────────────────────────────────────
    log.info("pdf_rendering", extra={"offer_ref": offer_ref})

    html_obj = HTML(string=html_str, base_url=str(TEMPLATES_DIR))
    pdf_bytes = html_obj.write_pdf(stylesheets=[css] if css else None)

    log.info("pdf_rendered", extra={
        "offer_ref": offer_ref,
        "size_kb":   round(len(pdf_bytes) / 1024, 1),
    })

    return pdf_bytes