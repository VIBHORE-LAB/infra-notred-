import requests
import json
import random
import time

BASE = "http://127.0.0.1:5001/infrared/api/v1"
EMAIL = "onlyvibhore@gmail.com"
PASSWORD = "Admin@123"

# Diverse construction-related images from Unsplash (IDs that are stable)
IMAGE_URLS = [
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800", # Workers
    "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?w=800", # Crane/Road
    "https://images.unsplash.com/photo-1517089596392-db9a5e9478cc?w=800", # Blueprint/Site
    "https://images.unsplash.com/photo-1590486803833-ffc94244b581?w=800", # Concrete
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800", # Engineering
    "https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?w=800", # Road work
]

FALLBACK_IMAGE = "https://res.cloudinary.com/demo/image/upload/sample.jpg"

# Project Locations (Approximate)
LOCATIONS = {
    "Gurugram": {"lat": 28.4595, "lon": 77.0266},
    "Noida": {"lat": 28.5355, "lon": 77.3910},
    "Delhi": {"lat": 28.6139, "lon": 77.2090},
}

def backfill_geo():
    # 1. Login
    print(f"Logging in as {EMAIL}...")
    res = requests.post(f"{BASE}/user/login", json={
        "req": {"signature": "backfill_login"},
        "payload": {"email": EMAIL, "password": PASSWORD}
    })
    token = res.json()["data"]["token"]
    company_code = "EZ8I2N" # Hardcoded based on fix_user.py

    headers = {
        "Authorization": f"Bearer {token}",
        "x-company-code": company_code
    }

    # 2. Get Projects
    print("Fetching projects...")
    res = requests.get(f"{BASE}/projects/", headers=headers)
    res_json = res.json()
    if res.status_code != 200 or "data" not in res_json or "projects" not in res_json["data"]:
        print(f"  ❌ Failed to fetch projects: {res_json}")
        return
    
    projects = res_json["data"]["projects"]

    if not projects:
        print("No projects found to backfill.")
        return

    # Create a minimal valid JPEG image (1x1 white pixel)
    # This is better than downloading random unsplash URLs which might fail/redirect
    MINIMAL_JPEG = (
        b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05'
        b'\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c'
        b' $.\'&#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00'
        b'\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07'
        b'\x08\t\n\x0b\xff\xc4\x00\xb5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x01}\x01\x02\x03'
        b'\x00\x04\x11\x05\x12!1A\x06\x13Qa\x07&#12;q\x81\x08\x14B\x91\xa1\x09#2b\xb1\xc1\x15R\xd1\xf0$3br\x82\x16'
        b'\xa2\xb2\xe1\x0b\x17\x23\x34\x43\x53\x63\x73\x83\x93\xa3\xb3\xc3\xd3\xe3\xf1\xff\xda\x00\x08\x01\x01\x00'
        b'\x00\x3f\x00\xd2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a('
        b'\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2'
        b'\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a'
        b'(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a(\xa2\x8a('
        b'\xa2\x8a(\xa2\x8a(\xa2\x8a(\xff\xd9'
    )

    # 3. Create Progress Reports
    for project in projects:
        p_id = project["id"]
        p_name = project["name"]
        p_city = project.get("location", {}).get("city", "Gurugram")
        
        base_loc = LOCATIONS.get(p_city, LOCATIONS["Gurugram"])
        
        print(f"\nProcessing project: {p_name} ({p_id})")
        
        # Create 6 reports for each project for a rich map
        REPORTS_PER_PROJECT = 6
        for i in range(REPORTS_PER_PROJECT):
            lat = base_loc["lat"] + random.uniform(-0.08, 0.08)
            lon = base_loc["lon"] + random.uniform(-0.08, 0.08)
            
            # Rotate through diverse construction images
            img_url = IMAGE_URLS[i % len(IMAGE_URLS)]
            print(f"  Downloading image: {img_url[:50]}...")
            try:
                img_res = requests.get(img_url, timeout=15)
                if img_res.status_code == 200 and 'image' in img_res.headers.get('Content-Type', ''):
                    img_data = img_res.content
                    print(f"    ✅ Image downloaded ({len(img_data)} bytes)")
                else:
                    print(f"    ⚠️ Invalid image response ({img_res.status_code}), using demo fallback")
                    img_data = requests.get(FALLBACK_IMAGE).content
            except Exception as e:
                print(f"    ⚠️ Download failed ({str(e)}), using demo fallback")
                img_data = requests.get(FALLBACK_IMAGE).content
            
            files = [
                ('images', ('report.jpg', img_data, 'image/jpeg'))
            ]
            
            descriptions = [
                f"Laying foundation for {p_name} sector {i+1}.",
                f"Structural inspection completed for {p_name} northern wing.",
                f"Quality check on materials for {p_name} - passing standards.",
                f"Site safety audit for {p_name} - no incidents reported.",
                f"Testing drainage and support systems at {p_name}.",
                f"Finalizing phase {i+1} of {p_name} project development."
            ]
            
            report_data = {
                "projectId": p_id,
                "latitude": lat,
                "longitude": lon,
                "description": descriptions[i % len(descriptions)],
            }
            
            res_rep = requests.post(
                f"{BASE}/progress-reports/",
                headers={"Authorization": f"Bearer {token}", "x-company-code": company_code},
                data=report_data,
                files=files
            )
            
            if res_rep.status_code == 201:
                print(f"   Report {i+1} created at {lat:.4f}, {lon:.4f}")
            else:
                print(f"  Failed to create report {i+1}: {res_rep.status_code} - {res_rep.text[:100]}...")
            
            time.sleep(0.3)

if __name__ == "__main__":
    backfill_geo()
