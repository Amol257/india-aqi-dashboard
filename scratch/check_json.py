import json
with open('public/data/local_aqi.json', 'r') as f:
    data = json.load(f)
    print(f"Stations: {len(data['stations'])}")
    print(f"Cities in aggregation: {len(data['city_aggregation'])}")
    print(f"Sample cities: {list(data['city_aggregation'].keys())[:10]}")
