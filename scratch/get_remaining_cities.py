import re
import json

with open('src/constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract MAJOR_CITIES_COMPARISON names
major_cities_match = re.search(r'export const MAJOR_CITIES_COMPARISON: CityData\[\] = \[(.*?)\];', content, re.DOTALL)
major_cities = []
if major_cities_match:
    major_cities = re.findall(r'"name":\s*"(.*?)"', major_cities_match.group(1))

# Extract TOP_POLLUTED_CITIES names
top_cities_match = re.search(r'export const TOP_POLLUTED_CITIES: CityData\[\] = \[(.*?)\];', content, re.DOTALL)
top_cities = []
if top_cities_match:
    top_cities = re.findall(r'"name":\s*"(.*?)"', top_cities_match.group(1))

# Extract STATIONS_DATA cities
stations_match = re.search(r'export const STATIONS_DATA = \[(.*?)\];', content, re.DOTALL)
stations_cities = []
if stations_match:
    # format is "city": "CityName, StateName"
    stations_cities_raw = re.findall(r'"city":\s*"(.*?)"', stations_match.group(1))
    for raw in stations_cities_raw:
        city = raw.split(',')[0].strip()
        stations_cities.append(city)

all_base_cities = set(major_cities + top_cities)
remaining_cities = sorted(list(set(stations_cities) - all_base_cities))

with open('scratch/cities_to_process.json', 'w', encoding='utf-8') as f:
    json.dump(remaining_cities, f)

print(f"Extracted {len(remaining_cities)} cities.")
