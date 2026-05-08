import os
import json

base_path = "public/db/cities"
with open('scratch/cities_to_process.json', 'r', encoding='utf-8') as f:
    remaining_cities = json.load(f)

actually_missing = []
for city in remaining_cities:
    city_dir = os.path.join(base_path, city)
    has_image = False
    if os.path.exists(city_dir):
        for file in os.listdir(city_dir):
            if file.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                has_image = True
                break
    
    if not has_image:
        actually_missing.append(city)

with open('scratch/actually_missing_cities.json', 'w', encoding='utf-8') as f:
    json.dump(actually_missing, f)

print(f"{len(actually_missing)} cities still missing images.")
print(f"Top 10 missing: {actually_missing[:10]}")
