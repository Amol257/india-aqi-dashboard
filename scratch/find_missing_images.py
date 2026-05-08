import re
import os

with open('src/constants.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all imageUrls
image_urls = re.findall(r'"imageUrl":\s*"(.*?)"', content)
cities_with_images = set()
for url in image_urls:
    # URL format: ./db/cities/Khora/Khora.jpg
    parts = url.split('/')
    if len(parts) >= 4 and parts[2] == 'cities':
        cities_with_images.add(parts[3])

# Find all cities in STATIONS_DATA
# format: "city": "CityName, StateName"
station_cities = re.findall(r'"city":\s*"(.*?),\s*(.*?)"', content)
unique_cities = set(c[0] for c in station_cities)

# Also check TOP_POLLUTED_CITIES and MAJOR_CITIES_COMPARISON names
base_cities = re.findall(r'"name":\s*"(.*?)"', content)
unique_cities.update(base_cities)

missing_images = unique_cities - cities_with_images
# Filter out some non-city names if any
missing_images = [c for c in missing_images if c and not c.startswith('http') and len(c) > 2]

print(sorted(list(missing_images)))
