from typing import List


CELL_SIZE   = 40
LABEL_H     = 24
PADDING     = 16
FONT_FAMILY = "Arial, sans-serif"

COLOUR_MAP = {
    0: {"bg": "#f5f5f5", "text": "#cccccc", "border": "#eeeeee"},
    1: {"bg": "#fde8de", "text": "#e8521a", "border": "#e8521a"},
    2: {"bg": "#fbc7ad", "text": "#c4421a", "border": "#c4421a"},
    3: {"bg": "#f4956a", "text": "#ffffff", "border": "#c4421a"},
    4: {"bg": "#ec6535", "text": "#ffffff", "border": "#a33216"},
    5: {"bg": "#e8521a", "text": "#ffffff", "border": "#8a2a12"},
}


def generate_zone_svg(
    ballast_grid:      list,
    label:             str,
    tile_thickness:    int,
    tiles_per_shelter: int,
) -> str:
    rows = len(ballast_grid)
    cols = max(len(r) for r in ballast_grid) if ballast_grid else 0

    CELL    = 40
    LABEL_H = 24
    PAD     = 16

    width  = PAD * 2 + cols * CELL
    height = PAD * 2 + LABEL_H + rows * CELL + LABEL_H + 8

    def colour(tiles):
        return COLOUR_MAP.get(min(tiles, 5), COLOUR_MAP[5])

    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}">',
        f'<rect width="{width}" height="{height}" fill="#ffffff" rx="4"/>',
        f'<text x="{PAD}" y="{PAD + 16}" '
        f'font-family="Arial, sans-serif" font-size="13" '
        f'font-weight="bold" fill="#1a1a1a">{label}</text>',
    ]

    for r, row in enumerate(ballast_grid):
        for c, tiles in enumerate(row):
            x    = PAD + c * CELL
            y    = PAD + LABEL_H + r * CELL
            c_   = colour(tiles)
            bg   = c_["bg"]
            tc   = c_["text"]
            bord = c_["border"]

            lines.append(
                f'<rect x="{x}" y="{y}" '
                f'width="{CELL}" height="{CELL}" '
                f'fill="{bg}" stroke="{bord}" stroke-width="0.5" rx="2"/>'
            )

            if tiles > 0:
                cx = x + CELL // 2
                cy = y + CELL // 2 + 5
                lines.append(
                    f'<text x="{cx}" y="{cy}" '
                    f'font-family="Arial, sans-serif" font-size="12" '
                    f'font-weight="700" text-anchor="middle" fill="{tc}">'
                    f'{tiles}</text>'
                )

    legend_y = PAD + LABEL_H + rows * CELL + 8
    lx = PAD
    lines.append(
        f'<text x="{lx}" y="{legend_y + 12}" '
        f'font-family="Arial, sans-serif" font-size="10" fill="#888888">'
        f'Tiles per shelter: {tiles_per_shelter} × {tile_thickness}mm'
        f'</text>'
    )

    lines.append('</svg>')
    return "\n".join(lines)


def generate_all_zones_svg(zones: list, tile_thickness: int) -> list:
    svgs = []
    for zone in zones:
        svg = generate_zone_svg(
            ballast_grid      = zone["ballast_grid"],
            label             = zone["label"],
            tile_thickness    = tile_thickness,
            tiles_per_shelter = zone["tiles_per_shelter"],
        )
        svgs.append(svg)
    return svgs