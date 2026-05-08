import os
import subprocess

cities = {
    "Ambernath": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Ambernath_Shiv_Temple.jpg",
    "Amravati": "https://upload.wikimedia.org/wikipedia/commons/9/91/Entrance_of_Ambadevi_Temple%2C_Amravati.jpg",
    "Amritsar": "https://upload.wikimedia.org/wikipedia/commons/f/f6/The_Golden_Temple_of_Amritsar_7.jpg",
    "Anantapur": "https://upload.wikimedia.org/wikipedia/commons/6/6f/AP_Lepakshi_Veerabhadra_Temple.jpg",
    "Angul": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Saila_Srikhetra%2C_Angul.png",
    "Ankleshwar": "https://upload.wikimedia.org/wikipedia/commons/0/07/Narmada_Bridge%2C_Ankleshwar.jpg",
    "Araria": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Bihar_Araria_Raniganj_vatika.jpg/1200px-Bihar_Araria_Raniganj_vatika.jpg",
    "Arrah": "https://upload.wikimedia.org/wikipedia/commons/8/87/Aranya_Devi_Temple_Arrah.jpg",
    "Asansol": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Ghagar_Buri_Chandi_Mata_Temple.jpg",
    "Aurangabad": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Aurangabad%2C_Bibi_Ka_Maqbara_%289842174586%29.jpg/1200px-Aurangabad%2C_Bibi_Ka_Maqbara_%289842174586%29.jpg"
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

print("Batch 2 download complete.")
