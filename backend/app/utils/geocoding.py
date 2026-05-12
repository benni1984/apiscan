from dataclasses import dataclass
from typing import Optional

import httpx


@dataclass
class CityLocation:
    name: str
    latitude: float
    longitude: float


def reverse_geocode_city(latitude: float, longitude: float) -> Optional[CityLocation]:
    """Return nearest city/town/village centroid via Nominatim at zoom=10.
    Returns None on any network or parse failure."""
    try:
        resp = httpx.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": latitude, "lon": longitude, "format": "json", "zoom": 10},
            headers={"User-Agent": "ApiScan/1.0 (beekeeping-inspection-app)"},
            timeout=5.0,
        )
        resp.raise_for_status()
        data = resp.json()
        addr = data.get("address", {})
        name = (
            addr.get("city")
            or addr.get("town")
            or addr.get("village")
            or addr.get("municipality")
            or data.get("display_name", "").split(",")[0]
        )
        return CityLocation(
            name=name,
            latitude=float(data["lat"]),
            longitude=float(data["lon"]),
        )
    except Exception:
        return None
