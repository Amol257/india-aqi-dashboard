import os
import subprocess

cities = {
    "Agartala": "https://upload.wikimedia.org/wikipedia/commons/e/e0/The_Ujjayanta_Palace.jpg",
    "Agra": "https://upload.wikimedia.org/wikipedia/commons/1/1d/Taj_Mahal_%28Edited%29.jpg",
    "Ahmedabad": "https://upload.wikimedia.org/wikipedia/commons/1/14/Sabarmati_ashram.jpg",
    "Ahmednagar": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Ahmednagar_Fort.jpg",
    "Aizawl": "https://upload.wikimedia.org/wikipedia/commons/4/42/Solomon%27s_Temple%2C_Aizawl.jpg",
    "Ajmer": "https://upload.wikimedia.org/wikipedia/commons/8/87/Ajmer_Sharif_Dargah.jpg",
    "Akola": "https://upload.wikimedia.org/wikipedia/commons/3/3a/Narnala_Fort_Akola.jpg",
    "Alwar": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Bala_Quila_Fort.jpg",
    "Amaravati": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Amaravati_Stupa.jpg",
    "Ambala": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Ambala_Badshahi_Bagh_Gurudwara.jpg"
}

base_path = "public/db/cities"

for city, url in cities.items():
    city_dir = os.path.join(base_path, city)
    if not os.path.exists(city_dir):
        os.makedirs(city_dir)
    
    file_path = os.path.join(city_dir, f"{city}.jpg")
    print(f"Downloading {city} from {url}...")
    
    # Using curl.exe to download
    try:
        # -L to follow redirects, -k to ignore SSL errors if any, -o to specify output
        subprocess.run(["curl.exe", "-L", "-o", file_path, url], check=True)
        print(f"Successfully downloaded {city}.")
    except Exception as e:
        print(f"Failed to download {city}: {e}")

print("Batch 1 download complete.")
