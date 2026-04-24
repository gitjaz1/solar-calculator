from dataclasses import dataclass, field
from typing import List, Optional
import math

from .excel_reader import get_ballast_tiles, get_tile_weight, get_pricing


# ── Data classes ──────────────────────────────────────────────────────

@dataclass
class Zone:
    id:    int
    label: str
    grid:  List[List[bool]]

    @property
    def rows(self):
        return len(self.grid)

    @property
    def cols(self):
        return len(self.grid[0]) if self.grid else 0

    def cell(self, r: int, c: int) -> bool:
        if 0 <= r < self.rows and 0 <= c < self.cols:
            return self.grid[r][c]
        return False


@dataclass
class Project:
    panel_thickness:     int
    panel_length:        int
    consequence_class:   str
    design_working_life: str
    basic_wind_velocity: int
    terrain_category:    str
    tile_thickness:      int
    country:             str  = "BE"


@dataclass
class ZoneResult:
    zone_id:          int
    label:            str
    shelters:         int
    serials:          int
    parallels:        int
    tiles_per_shelter: int
    tiles_total:      int
    ballast_weight_kg: float
    ballast_positions: int
    ballast_grid:     List[List[int]]


@dataclass
class CalcResult:
    zones:                  List[ZoneResult]
    total_shelters:         int
    total_tiles:            int
    total_ballast_weight_kg: float
    approx_trucks:          int
    bom:                    dict
    unit_prices:            dict
    discount_tiers:         list
    subtotal:               float
    discount_pct:           float
    discount_amount:        float
    total_price:            float


# ── Connection detection ──────────────────────────────────────────────

def count_serials(zone: Zone) -> int:
    count = 0
    for r in range(zone.rows):
        for c in range(zone.cols - 1):
            if not zone.cell(r, c):
                continue
            # find next occupied cell in this row
            gap = 0
            for nc in range(c + 1, zone.cols):
                if zone.cell(r, nc):
                    if gap <= 1:
                        count += 1
                    break
                gap += 1
    return count


def count_parallels(zone: Zone) -> int:
    count = 0
    for r in range(zone.rows - 1):
        for c in range(zone.cols):
            if not zone.cell(r, c):
                continue
            gap = 0
            for nr in range(r + 1, zone.rows):
                if zone.cell(nr, c):
                    if gap <= 1:
                        count += 1
                    break
                gap += 1
    return count


# ── Ballast grid ──────────────────────────────────────────────────────

def build_ballast_grid(zone: Zone, tiles_per_shelter: int) -> List[List[int]]:
    grid = []
    for r in range(zone.rows):
        row = []
        for c in range(zone.cols):
            row.append(tiles_per_shelter if zone.cell(r, c) else 0)
        grid.append(row)
    return grid


# ── BOM calculation ───────────────────────────────────────────────────

def build_bom(
    zones:          List[ZoneResult],
    panel_thickness: int,
) -> dict:
    total_shelters  = sum(z.shelters  for z in zones)
    total_serials   = sum(z.serials   for z in zones)
    total_parallels = sum(z.parallels for z in zones)
    total_tiles     = sum(z.tiles_total for z in zones)

    clamp_article = {
        25: "100701",
        30: "100801",
        35: "100901",
    }.get(panel_thickness, "100801")

    # Each shelter has 4 module clamps
    clamps = total_shelters * 4

    return {
        "200101": {"description": "Shelter",                  "qty": total_shelters,  "unit": "pcs"},
        "200201": {"description": "Interconnection Serial",   "qty": total_serials,   "unit": "pcs"},
        "200301": {"description": "Interconnection Parallel", "qty": total_parallels, "unit": "pcs"},
        clamp_article: {"description": f"Module clamp {panel_thickness}mm", "qty": clamps, "unit": "pcs"},
        "100601": {"description": "Ballast Carrier",          "qty": total_tiles,     "unit": "pcs"},
    }


# ── Pricing ───────────────────────────────────────────────────────────

def apply_pricing(bom: dict, unit_prices: dict, discount_tiers: list):
    total_qty = sum(item["qty"] for item in bom.values())

    discount_pct = 0
    for tier in sorted(discount_tiers, key=lambda t: t["min_qty"], reverse=True):
        if total_qty >= tier["min_qty"]:
            discount_pct = tier["discount_pct"]
            break

    subtotal = 0.0
    for article, item in bom.items():
        price = unit_prices.get(article, 0.0)
        item["unit_price"] = price
        item["line_total"] = round(price * item["qty"], 2)
        subtotal += item["line_total"]

    discount_amount = round(subtotal * discount_pct / 100, 2)
    total_price     = round(subtotal - discount_amount, 2)

    return subtotal, discount_pct, discount_amount, total_price


# ── Main entry point ──────────────────────────────────────────────────

def calculate(zones_data: list, project_data: dict) -> dict:
    project = Project(
        panel_thickness     = int(project_data["panelThickness"]),
        panel_length        = int(project_data.get("panelLength", 2000)),
        consequence_class   = project_data["consequenceClass"],
        design_working_life = project_data["designWorkingLife"],
        basic_wind_velocity = int(project_data["basicWindVelocity"]),
        terrain_category    = project_data["terrainCategory"],
        tile_thickness      = int(project_data["tileThickness"]),
        country             = project_data.get("country", "BE"),
    )

    zones = [
        Zone(
            id    = z["id"],
            label = z["label"],
            grid  = [[bool(cell) for cell in row] for row in z["grid"]],
        )
        for z in zones_data
    ]

    tiles_per_shelter = get_ballast_tiles(
        panel_thickness   = project.panel_thickness,
        tile_thickness    = project.tile_thickness,
        consequence_class = project.consequence_class,
        terrain_category  = project.terrain_category,
        wind_velocity     = project.basic_wind_velocity,
    )

    tile_weight_kg = get_tile_weight(project.tile_thickness)

    zone_results = []
    for zone in zones:
        shelters  = sum(zone.cell(r, c) for r in range(zone.rows) for c in range(zone.cols))
        serials   = count_serials(zone)
        parallels = count_parallels(zone)

        tiles_total       = shelters * tiles_per_shelter
        ballast_weight_kg = tiles_total * tile_weight_kg
        ballast_positions = tiles_total
        ballast_grid      = build_ballast_grid(zone, tiles_per_shelter)

        zone_results.append(ZoneResult(
            zone_id           = zone.id,
            label             = zone.label,
            shelters          = shelters,
            serials           = serials,
            parallels         = parallels,
            tiles_per_shelter = tiles_per_shelter,
            tiles_total       = tiles_total,
            ballast_weight_kg = round(ballast_weight_kg, 1),
            ballast_positions = ballast_positions,
            ballast_grid      = ballast_grid,
        ))

    total_shelters          = sum(z.shelters          for z in zone_results)
    total_tiles             = sum(z.tiles_total       for z in zone_results)
    total_ballast_weight_kg = sum(z.ballast_weight_kg for z in zone_results)

    # Approximate trucks: 1 truck per 1000kg ballast
    approx_trucks = max(1, math.ceil(total_ballast_weight_kg / 1000))

    bom = build_bom(zone_results, project.panel_thickness)

    pricing                                      = get_pricing()
    unit_prices                                  = pricing["unit_prices"]
    discount_tiers                               = pricing["discount_tiers"]
    subtotal, discount_pct, discount_amount, total_price = apply_pricing(
        bom, unit_prices, discount_tiers
    )

    return {
        "zones": [
            {
                "zone_id":           z.zone_id,
                "label":             z.label,
                "shelters":          z.shelters,
                "serials":           z.serials,
                "parallels":         z.parallels,
                "tiles_per_shelter": z.tiles_per_shelter,
                "tiles_total":       z.tiles_total,
                "ballast_weight_kg": z.ballast_weight_kg,
                "ballast_positions": z.ballast_positions,
                "ballast_grid":      z.ballast_grid,
            }
            for z in zone_results
        ],
        "total_shelters":          total_shelters,
        "total_tiles":             total_tiles,
        "total_ballast_weight_kg": round(total_ballast_weight_kg, 1),
        "approx_trucks":           approx_trucks,
        "bom":                     bom,
        "unit_prices":             unit_prices,
        "discount_tiers":          discount_tiers,
        "subtotal":                subtotal,
        "discount_pct":            discount_pct,
        "discount_amount":         discount_amount,
        "total_price":             total_price,
    }