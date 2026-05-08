"""
fetch_aqi_data.py
-----------------
Fetches fresh AQI data from data.gov.in API, cleans it, and writes
public/data/local_aqi.json in the exact format the dashboard expects.

Usage:
    python scripts/fetch_aqi_data.py

Environment variables (or .env file):
    DATA_GOV_API_KEY  – your data.gov.in API key
                        (falls back to the public demo key if not set)
"""

import os
import json
import time
import random
import logging
import requests
from datetime import datetime, timezone
from collections import defaultdict
from pathlib import Path
from dotenv import load_dotenv  # pip install python-dotenv

load_dotenv()  # reads .env if present

# ── Config ────────────────────────────────────────────────────────────────────
API_KEY     = os.getenv("DATA_GOV_API_KEY",
                        "579b464db66ec23bdd00000189279fc7106147b759c6c62ccec790e9")
BASE_URL    = "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "public" / "data" / "local_aqi.json"
BATCH_SIZE  = 500       # records per API request (max the API allows is ~500)
MAX_RECORDS = 20_000    # safety cap to avoid runaway pagination
RETRY_WAIT  = 5         # seconds between retries
MAX_RETRIES = 3

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Tier / city metadata ──────────────────────────────────────────────────────
TIER_1 = {
    "Delhi", "Mumbai", "Bengaluru", "Kolkata", "Chennai",
    "Hyderabad", "Ahmedabad", "Pune", "Surat",
}
INDUSTRIAL_KEYWORDS = {
    "Industrial", "Zone", "MIDC", "GIDC", "RIICO", "SIDCO",
    "Phase", "Sector", "Belt", "Baddi", "Suakati",
    "Mandi Gobindgarh", "Vapi", "Ankleshwar", "Singrauli",
}

# ── Density lookup (static proxy; update as needed) ───────────────────────────
BASE_DENSITY = {"Tier 1": 90, "Industrial": 75, "Tier 2": 40}


# ── API helpers ───────────────────────────────────────────────────────────────
def fetch_page(offset: int, limit: int) -> list[dict]:
    """Fetch a single page from the API, with retries."""
    params = {
        "api-key": API_KEY,
        "format": "json",
        "offset": offset,
        "limit": limit,
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.get(BASE_URL, params=params, headers=headers, timeout=60)
            resp.raise_for_status()
            payload = resp.json()
            records = payload.get("records", [])
            log.info("  offset=%d → %d records (attempt %d)", offset, len(records), attempt)
            return records
        except Exception as exc:
            log.warning("  Fetch failed (attempt %d/%d): %s", attempt, MAX_RETRIES, exc)
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_WAIT * attempt)
    log.error("  All retries exhausted at offset=%d", offset)
    return []


def fetch_all_records() -> list[dict]:
    """Paginate through the full dataset."""
    all_records: list[dict] = []
    offset = 0
    log.info("Starting API fetch from data.gov.in …")
    while True:
        page = fetch_page(offset, BATCH_SIZE)
        if not page:
            break
        all_records.extend(page)
        if len(page) < BATCH_SIZE:
            break                       # last page
        offset += BATCH_SIZE
        if offset >= MAX_RECORDS:
            log.warning("Hit MAX_RECORDS cap (%d). Stopping pagination.", MAX_RECORDS)
            break
        time.sleep(0.3)                 # be polite to the API
    log.info("Total raw records fetched: %d", len(all_records))
    return all_records


# ── Data cleaning & aggregation ───────────────────────────────────────────────
def clean_value(v) -> float | None:
    """Return a clean float or None for missing/zero/NA values."""
    if v is None:
        return None
    
    # Handle common placeholder strings
    s = str(v).strip().upper()
    if s in ["N/A", "NA", "NULL", "NONE", "", "NAN", "-"]:
        return None
        
    try:
        f = float(v)
        # Exclude zeros and negatives as per user request
        return f if f > 0 else None
    except (TypeError, ValueError):
        return None


def determine_tier(city_name: str, state: str, avg_aqi: float) -> str:
    if city_name in TIER_1:
        return "Tier 1"
    if any(kw in city_name or kw in state for kw in INDUSTRIAL_KEYWORDS) or avg_aqi > 300:
        return "Industrial"
    return "Tier 2"


def aggregate(records: list[dict]) -> dict:
    """
    Aggregate raw API records into the local_aqi.json schema.

    Expected API fields (may vary):
        country, state, city, station, last_update,
        latitude, longitude, pollutant_id,
        min_value, max_value, avg_value
    """
    cities: dict = defaultdict(lambda: {
        "state": "",
        "aqi_values": [],
        "stations": set(),
        "pollutants": defaultdict(lambda: {"values": [], "lastUpdate": ""}),
    })

    skipped = 0
    for rec in records:
        city  = str(rec.get("city", "")).replace("_", " ").strip()
        state = str(rec.get("state", "")).replace("_", " ").strip()
        pollutant   = str(rec.get("pollutant_id", "")).strip()
        station     = str(rec.get("station", "")).strip()
        last_update = str(rec.get("last_update", "")).strip()
        avg_val     = clean_value(rec.get("avg_value"))

        if not city or not pollutant or avg_val is None:
            skipped += 1
            continue

        cities[city]["state"] = state
        cities[city]["aqi_values"].append(avg_val)
        cities[city]["stations"].add(station)
        cities[city]["pollutants"][pollutant]["values"].append(avg_val)
        cities[city]["pollutants"][pollutant]["lastUpdate"] = last_update  # keep latest

    log.info("Skipped %d records (missing city/pollutant/avg_value or zero)", skipped)

    final: dict = {}
    for city_name, data in cities.items():
        aqi_vals = data["aqi_values"]
        if not aqi_vals:
            continue

        # CPCB Method: Overall AQI is the maximum of the individual sub-indices
        avg_aqi  = max(aqi_vals)
        peak_aqi = max(aqi_vals)
        tier     = determine_tier(city_name, data["state"], avg_aqi)
        density  = BASE_DENSITY[tier] + random.randint(-10, 10)  # ±10 jitter proxy

        final[city_name] = {
            "name":    city_name,
            "state":   data["state"],
            "avgAqi":  round(avg_aqi),
            "peakAqi": round(peak_aqi),
            "category": tier,
            "stationsCount": len(data["stations"]),
            "density": density,
            "pollutants": {
                p_id: {
                    "value":      round(sum(p["values"]) / len(p["values"])),
                    "station":    f"Avg of {len(p['values'])} stations",
                    "lastUpdate": p["lastUpdate"],
                }
                for p_id, p in data["pollutants"].items()
                if p["values"]
            },
            "respiratoryAdmissions": round(avg_aqi * 12.5),
            "fetchedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        }

    return final


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    records = fetch_all_records()

    if not records:
        log.error("No records fetched – aborting to avoid overwriting existing data.")
        raise SystemExit(1)

    city_data = aggregate(records)
    log.info("Aggregated %d cities.", len(city_data))

    # Prepare station-level data
    all_stations = []
    # We'll re-process records to get station objects
    # Note: Each record is a pollutant at a station. We need to group by station.
    stations_map = {}
    for rec in records:
        loc = rec.get("station")
        if not loc: continue
        if loc not in stations_map:
            # Determine region (simplified mapping)
            state = rec.get("state", "")
            region = "North India" if state in ["Delhi", "Haryana", "Punjab", "Uttar Pradesh"] else \
                     "South India" if state in ["Tamil Nadu", "Karnataka", "Telangana", "Andhra Pradesh", "Kerala"] else \
                     "West India" if state in ["Gujarat", "Maharashtra", "Rajasthan"] else \
                     "East India" if state in ["West Bengal", "Odisha", "Bihar", "Tripura"] else "Central India"
            
            stations_map[loc] = {
                "id": str(len(stations_map) + 1),
                "location": loc,
                "city": f"{rec.get('city')}, {state}",
                "status": "ACTIVE",
                "region": region,
                "lat": float(rec.get("latitude", 0)) if rec.get("latitude") else 20.0,
                "lng": float(rec.get("longitude", 0)) if rec.get("longitude") else 78.0,
                "aqi": 0,
                "pollutants": [],
                "pollutant_values": {}
            }
        
        p_id = rec.get("pollutant_id")
        avg_val = clean_value(rec.get("avg_value"))
        if p_id and avg_val is not None:
            stations_map[loc]["pollutants"].append(p_id)
            stations_map[loc]["pollutant_values"][p_id] = float(avg_val)
            # Official CPCB Method: Overall AQI is the maximum of the individual sub-indices
            stations_map[loc]["aqi"] = max(stations_map[loc]["aqi"], int(avg_val))

    # Filter out stations that have 0 AQI or no pollutants (invalid data)
    valid_stations = [s for s in stations_map.values() if s["aqi"] > 0 and len(s["pollutants"]) > 0]
    
    output_data = {
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "stations": valid_stations,
        "city_aggregation": city_data
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as fh:
        json.dump(output_data, fh, indent=2, ensure_ascii=False)

    log.info("✓ Written → %s", OUTPUT_PATH)


if __name__ == "__main__":
    main()
