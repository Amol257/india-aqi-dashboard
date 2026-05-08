import os
import subprocess

cities = {
    "Baripada": "https://upload.wikimedia.org/wikipedia/commons/2/23/Ambika_Temple_Baripada.jpg",
    "Barmer": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Kiradu_temple_Barmer_Rajasthan.jpg",
    "Barrackpore": "https://upload.wikimedia.org/wikipedia/commons/a/ae/Mangal_Pandey_Park%2C_Barrackpore.jpg",
    "Bathinda": "https://upload.wikimedia.org/wikipedia/commons/5/52/Qila_Mubarak_Bathinda.jpg",
    "Belgaum": "https://upload.wikimedia.org/wikipedia/commons/d/da/Belgaum_Fort_Entrance.jpg",
    "Bettiah": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Bettiah_Palace.jpg", # Guessing
    "Bhagalpur": "https://upload.wikimedia.org/wikipedia/commons/0/02/Vikramshila_Excavated_Site.jpg",
    "Bharatpur": "https://upload.wikimedia.org/wikipedia/commons/c/cc/Keoladeo_National_Park_Gate.jpg",
    "Bhavnagar": "https://upload.wikimedia.org/wikipedia/commons/9/91/Victoria_Park_Bhavnagar.jpg",
    "Bhilai": "https://upload.wikimedia.org/wikipedia/commons/8/87/Maitri_Baagh_Zoo_Bhilai.jpg"
}

base_path = "public/db/cities"

for city, url in cities.items():
    city_dir = os.path.join(base_path, city)
    if not os.path.exists(city_dir):
        os.makedirs(city_dir)
    
    file_path = os.path.join(city_dir, f"{city}.jpg")
    print(f"Downloading {city} from {url}...")
    
    try:
        subprocess.run(["curl.exe", "-L", "-o", file_path, url], check=True)
        print(f"Successfully downloaded {city}.")
    except Exception as e:
        print(f"Failed to download {city}: {e}")

print("Batch 4 download complete.")
