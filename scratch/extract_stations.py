import csv
import json

states_to_region = {
    'Delhi': 'North India', 'Punjab': 'North India', 'Haryana': 'North India', 'Rajasthan': 'North India',
    'Himachal Pradesh': 'North India', 'Jammu & Kashmir': 'North India', 'Uttarakhand': 'North India',
    'Uttar Pradesh': 'North India', 'Chandigarh': 'North India',
    'Maharashtra': 'West India', 'Gujarat': 'West India', 'Goa': 'West India', 'Dadra & Nagar Haveli': 'West India',
    'Karnataka': 'South India', 'Tamil Nadu': 'South India', 'Kerala': 'South India', 'Andhra Pradesh': 'South India', 'Telangana': 'South India', 'Puducherry': 'South India',
    'West Bengal': 'East India', 'Bihar': 'East India', 'Odisha': 'East India', 'Jharkhand': 'East India',
    'Assam': 'East India', 'Sikkim': 'East India', 'Meghalaya': 'East India', 'Mizoram': 'East India',
    'Nagaland': 'East India', 'Manipur': 'East India', 'Tripura': 'East India', 'Arunachal Pradesh': 'East India',
    'Madhya Pradesh': 'Central India', 'Chhattisgarh': 'Central India'
}

stations = {}

with open('c:/Users/Amol/Desktop/Antigravity/data/aqi_raw.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        avg_val = row['avg_value']
        if avg_val == 'NA' or float(avg_val) == 0:
            continue
            
        key = (row['station'], row['city'], row['state'])
        if key not in stations:
            stations[key] = {
                "id": str(len(stations) + 1),
                "location": row['station'],
                "city": f"{row['city']}, {row['state']}",
                "pollutants_map": {}, 
                "status": "ACTIVE",
                "region": states_to_region.get(row['state'], "Central India"),
                "lat": float(row['latitude']) if row['latitude'] != 'NA' else 0,
                "lng": float(row['longitude']) if row['longitude'] != 'NA' else 0
            }
        
        stations[key]["pollutants_map"][row['pollutant_id']] = float(avg_val)

final_stations = []
for s in stations.values():
    vals = s["pollutants_map"].values()
    s["aqi"] = round(max(vals)) if vals else 0
    s["pollutants"] = list(s["pollutants_map"].keys()) # List for UI tags
    # Keep pollutant_values for the Composite page correlation plots
    s["pollutant_values"] = s["pollutants_map"]
    del s["pollutants_map"]
    final_stations.append(s)

with open('c:/Users/Amol/Desktop/Antigravity/AQI project/scratch/stations_extracted.json', 'w', encoding='utf-8') as f:
    json.dump(final_stations, f, indent=2)

print(f"Extracted {len(final_stations)} stations with detailed pollutant values.")
