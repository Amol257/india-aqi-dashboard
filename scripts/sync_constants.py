
import json
import re
import os

def update_constants():
    constants_path = 'src/constants.ts'
    local_aqi_path = 'public/data/local_aqi.json'
    
    if not os.path.exists(local_aqi_path):
        print(f"Error: {local_aqi_path} not found.")
        return

    with open(local_aqi_path, 'r', encoding='utf-8') as f:
        new_data = json.load(f)
        new_stations = {s['location']: s for s in new_data.get('stations', [])}
        fetched_at = new_data.get('fetchedAt', 'Just now')

    with open(constants_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update STATIONS_DATA
    # We'll use a regex to find the array and replace its elements
    # This is tricky because the file is 15k lines.
    # Instead of regex, we'll parse the array if possible, or just do a string replacement of values.
    
    # Actually, a safer way to satisfy the user who is looking at lines 13596+ is to 
    # update the AQI values for the stations we find.
    
    def replace_aqi(match):
        location_match = re.search(r'"location":\s*"([^"]+)"', match.group(0))
        if location_match:
            location = location_match.group(1)
            if location in new_stations:
                new_stn = new_stations[location]
                updated_block = match.group(0)
                # Replace AQI
                updated_block = re.sub(r'"aqi":\s*\d+', f'"aqi": {new_stn["aqi"]}', updated_block)
                # Replace pollutant_values if present
                if "pollutant_values" in updated_block and "pollutant_values" in new_stn:
                    pv_str = json.dumps(new_stn["pollutant_values"], indent=6).replace('\n', '\n    ')
                    updated_block = re.sub(r'"pollutant_values":\s*\{[^\}]+\}', f'"pollutant_values": {pv_str}', updated_block)
                return updated_block
        return match.group(0)

    # Search for station objects: { "id": "...", ... }
    # This might be slow on 15k lines but Python regex is fast.
    station_pattern = re.compile(r'\{\s*"id":\s*"\d+",\s*"location":\s*"[^"]+".*?\}', re.DOTALL)
    new_content = station_pattern.sub(replace_aqi, content)

    # 2. Update all city blocks (TOP_POLLUTED_CITIES, MAJOR_CITIES_COMPARISON, etc.)
    all_cities_data = new_data.get('city_aggregation', {})
    
    for name, city in all_cities_data.items():
        aqi = city['avgAqi']
        pm25 = city['pollutants'].get('PM2.5', {}).get('value', round(aqi * 0.6))
        
        escaped_name = re.escape(name)
        pattern_str = r'\{\s*"name":\s*"' + escaped_name + r'".*?\}'
        city_pattern = re.compile(pattern_str, re.DOTALL)
        
        def replace_city(m):
            block = m.group(0)
            # Update AQI
            block = re.sub(r'"aqi":\s*\d+', f'"aqi": {aqi}', block)
            # Update PM2.5
            block = re.sub(r'"pm25":\s*\d+', f'"pm25": {pm25}', block)
            # Update Status based on AQI
            status = 'Hazardous' if aqi > 400 else 'Severe' if aqi > 300 else 'Very Poor' if aqi > 200 else 'Poor' if aqi > 100 else 'Moderate' if aqi > 50 else 'Good'
            block = re.sub(r'"status":\s*"[^"]+"', f'"status": "{status}"', block)
            return block
            
        new_content = city_pattern.sub(replace_city, new_content)

    with open(constants_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Successfully patched {constants_path} with data fetched at {fetched_at}")

if __name__ == "__main__":
    update_constants()
