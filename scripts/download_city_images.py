import os
import time
import random
import requests

from io import BytesIO
from PIL import Image

# UPDATED PATH for the current project
BASE_PATH = r"c:\Users\Amol\Desktop\Data Analysis Project\public\db\cities"

# YOUR PEXELS API KEY (Preserving from previous request)
PEXELS_API_KEY = "IwUaBFI0PaQ5hNEsJ2anWwEGwfpFRyrZTip4G4E4kCGpHyM8SjNkQxxT"

HEADERS = {
    "Authorization": PEXELS_API_KEY
}


def get_city_image(city_name):

    search_terms = [
        f"{city_name} skyline",
        f"{city_name} aerial",
        f"{city_name} cityscape",
        f"{city_name} landmark",
        f"{city_name} night city",
        f"{city_name} tourism"
    ]

    for term in search_terms:

        try:

            url = (
                "https://api.pexels.com/v1/search"
                f"?query={term}"
                "&per_page=15"
                "&orientation=landscape"
            )

            response = requests.get(
                url,
                headers=HEADERS,
                timeout=30
            )

            if response.status_code != 200:
                continue

            data = response.json()

            photos = data.get("photos", [])

            if not photos:
                continue

            for photo in photos:

                width = photo.get("width", 0)
                height = photo.get("height", 0)

                if width < height:
                    continue

                image_url = photo["src"].get("large2x")

                if image_url:
                    return image_url

        except Exception as e:

            print(f"Search error for {city_name}: {e}")

    return None


def download_image(url, save_path):

    try:

        response = requests.get(
            url,
            timeout=30
        )

        if response.status_code != 200:
            return False

        image = Image.open(
            BytesIO(response.content)
        ).convert("RGB")

        TARGET_WIDTH = 1600
        TARGET_HEIGHT = 900

        original_width, original_height = image.size

        target_ratio = (
            TARGET_WIDTH / TARGET_HEIGHT
        )

        original_ratio = (
            original_width / original_height
        )

        if original_ratio > target_ratio:

            new_height = original_height

            new_width = int(
                new_height * target_ratio
            )

            left = (
                original_width - new_width
            ) // 2

            top = 0

        else:

            new_width = original_width

            new_height = int(
                new_width / target_ratio
            )

            left = 0

            top = (
                original_height - new_height
            ) // 2

        right = left + new_width
        bottom = top + new_height

        image = image.crop((
            left,
            top,
            right,
            bottom
        ))

        image = image.resize(
            (
                TARGET_WIDTH,
                TARGET_HEIGHT
            )
        )

        image.save(
            save_path,
            format="JPEG",
            quality=95
        )

        return True

    except Exception as e:

        print(f"Download error: {e}")

        return False

def run():
    if not os.path.exists(BASE_PATH):
        print(f"Error: {BASE_PATH} does not exist.")
        return

    city_folders = [
        folder
        for folder in os.listdir(BASE_PATH)
        if os.path.isdir(os.path.join(BASE_PATH, folder))
    ]

    print(f"Found {len(city_folders)} cities")

    for city in city_folders:

        try:

            city_folder = os.path.join(
                BASE_PATH,
                city
            )

            save_path = os.path.join(
                city_folder,
                f"{city}.jpg"
            )

            print(f"\nDownloading image for {city}...")

            # REMOVE ALL EXISTING IMAGE FILES
            for file_name in os.listdir(city_folder):
                if file_name.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                    old_image_path = os.path.join(city_folder, file_name)
                    try:
                        os.remove(old_image_path)
                        print(f"Removed old image: {file_name}")
                    except Exception as e:
                        print(f"Could not remove {file_name}: {e}")

            image_url = get_city_image(city)

            if not image_url:

                print(f"No suitable image found for {city}")
                continue

            success = download_image(
                image_url,
                save_path
            )

            if success:
                print(f"Saved: {save_path}")
            else:
                print(f"Failed for {city}")

            time.sleep(random.uniform(1, 2))

        except Exception as e:

            print(f"Error processing {city}: {e}")

    print("\nAll cities processed")

if __name__ == "__main__":
    run()
