import os
import subprocess

cities = {
    "Badlapur": "https://upload.wikimedia.org/wikipedia/commons/e/ee/Barvi_Dam_Badlapur%2C_Thane_District_3.jpg",
    "Bagalkot": "https://upload.wikimedia.org/wikipedia/commons/8/87/Almatti_Dam_20.jpg",
    "Baghpat": "https://upload.wikimedia.org/wikipedia/commons/e/ef/Pura_Mahadev_Baghpat.jpg",
    "Bahadurgarh": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Bahadurgarh_Fort.jpg", # Guessing
    "Balasore": "https://upload.wikimedia.org/wikipedia/commons/2/23/Chandipur_sea_beach_Baleswar.jpg",
    "Ballabgarh": "https://upload.wikimedia.org/wikipedia/commons/0/07/Nahar_Singh_Mahal.jpg",
    "Banswara": "https://upload.wikimedia.org/wikipedia/commons/b/b8/Mahi_Bajaj_Sagar_Dam%2C_Banswara.jpg",
    "Baran": "https://upload.wikimedia.org/wikipedia/commons/d/df/Shahabad_Fort%2C_Baran.jpg",
    "Barbil": "https://upload.wikimedia.org/wikipedia/commons/a/ae/Murga_Mahadev_Temple%2C_Keonjhar.jpg",
    "Bareilly": "https://upload.wikimedia.org/wikipedia/commons/3/30/Alakhnath_Temple_Bareilly.jpg"
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

print("Batch 3 download complete.")
