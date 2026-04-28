import json

with open('c:/Users/Amol/Desktop/Antigravity/AQI project/src/constants.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('c:/Users/Amol/Desktop/Antigravity/AQI project/scratch/stations_extracted.json', 'r', encoding='utf-8') as f:
    stations_data = json.load(f)

start_line = -1
end_line = -1

for i, line in enumerate(lines):
    if 'export const STATIONS_DATA =' in line:
        start_line = i
    if start_line != -1 and line.strip() == '];' and i > start_line:
        # Check if it's the end of STATIONS_DATA
        # This is a bit fragile but should work given the file structure
        # Let's check the next few lines or context
        if i + 1 < len(lines) and 'export const HISTOGRAM_DATA' in lines[i+2]:
            end_line = i
            break
        # Special case for the end of file if it was the last one
        if i == len(lines) - 1:
            end_line = i
            break

if start_line != -1 and end_line != -1:
    new_stations_content = f"export const STATIONS_DATA = {json.dumps(stations_data, indent=2)};\n"
    new_lines = lines[:start_line] + [new_stations_content] + lines[end_line+1:]
    
    # Also update TOTAL_STATIONS
    for i, line in enumerate(new_lines):
        if 'export const TOTAL_STATIONS =' in line:
            new_lines[i] = f"export const TOTAL_STATIONS = {len(stations_data)};\n"
            break
            
    with open('c:/Users/Amol/Desktop/Antigravity/AQI project/src/constants.ts', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Successfully updated STATIONS_DATA and TOTAL_STATIONS in constants.ts")
else:
    print(f"Could not find STATIONS_DATA boundaries. Start: {start_line}, End: {end_line}")
