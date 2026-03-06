import os
from datetime import datetime, timedelta
from app import create_app
from app.extensions import mongo
from bson import ObjectId

def backfill_projects():
    app = create_app()
    with app.app_context():
        # Configuration
        company_code = "EZ8I2N"
        created_by = "69ab0c0f07179d2fc2d98e2a"  # Identified from existing projects
        
        projects = [
            {
                "name": "Atal Setu (Mumbai Trans Harbour Link)",
                "description": "India's longest sea bridge connecting Sewri in Mumbai to Chirle in Navi Mumbai, significantly reducing travel time and boosting economic connectivity.",
                "projectType": "Bridge & Road",
                "estimatedBudget": 180000000000,
                "fundingSource": "Public-Private Partnership",
                "city": "Mumbai",
                "state": "Maharashtra",
                "country": "India",
                "zipCode": "400015",
                "areaInSqFt": 21800000,
                "teamsize": 15000,
                "startDate": (datetime.utcnow() - timedelta(days=1800)).isoformat() + "Z",
                "deadline": (datetime.utcnow() + timedelta(days=60)).isoformat() + "Z",
                "utilizationPercent": 95,  # High utilization for a healthy near-completion project
                "status": "In Progress",
                "image": "https://images.nativeplanet.com/img/2024/01/untitleddesign-2024-01-08t144504-819-1704705857.jpg"
            },
            {
                "name": "Chenab Rail Bridge",
                "description": "The world's highest rail bridge, part of the Udhampur-Srinagar-Baramulla Rail Link (USBRL) project, engineering marvel spanning the Chenab River.",
                "projectType": "Railway & Bridge",
                "estimatedBudget": 14000000000,
                "fundingSource": "Government of India",
                "city": "Reasi",
                "state": "Jammu & Kashmir",
                "country": "India",
                "zipCode": "182311",
                "areaInSqFt": 500000,
                "teamsize": 5000,
                "startDate": (datetime.utcnow() - timedelta(days=2500)).isoformat() + "Z",
                "deadline": (datetime.utcnow() + timedelta(days=120)).isoformat() + "Z",
                "utilizationPercent": 92, # Healthy
                "status": "In Progress",
                "image": "https://upload.wikimedia.org/wikipedia/commons/c/c2/Chenab_Rail_Bridge%2C_Reasi_district%2C_Jammu_and_Kashmir%2C_India.jpg"
            },
            {
                "name": "Delhi-Mumbai Expressway (Stretch 1)",
                "description": "An 8-lane expressway connecting India's national capital with its financial capital, reducing travel time to 12 hours.",
                "projectType": "Highway",
                "estimatedBudget": 1000000000000,
                "fundingSource": "NHAI",
                "city": "Gurugram/Jaipur",
                "state": "Haryana/Rajasthan",
                "country": "India",
                "zipCode": "122001",
                "areaInSqFt": 500000000,
                "teamsize": 25000,
                "startDate": (datetime.utcnow() - timedelta(days=1000)).isoformat() + "Z",
                "deadline": (datetime.utcnow() + timedelta(days=400)).isoformat() + "Z",
                "utilizationPercent": 75, # Healthy (ahead of time ratio)
                "status": "In Progress",
                "image": "https://english.cdn.zeenews.com/sites/default/files/2022/12/28/1134909-delhi-mumbai-expressway.jpg"
            },
            {
                "name": "Navi Mumbai International Airport",
                "description": "A greenfield airport being built to serve the Mumbai Metropolitan Region, designed to handle 60 million passengers annually.",
                "projectType": "Airport",
                "estimatedBudget": 160000000000,
                "fundingSource": "Adani Airports / CIDCO",
                "city": "Navi Mumbai",
                "state": "Maharashtra",
                "country": "India",
                "zipCode": "410206",
                "areaInSqFt": 125000000,
                "teamsize": 8000,
                "startDate": (datetime.utcnow() - timedelta(days=1200)).isoformat() + "Z",
                "deadline": (datetime.utcnow() + timedelta(days=365)).isoformat() + "Z",
                "utilizationPercent": 40, # Unhealthy (delayed - budget spent vs progress or time ratio)
                # To make it "Unhealthy" (Delayed): 
                # time_ratio = 1200 / (1200 + 365) = ~0.76
                # utilization = 40 (Way below time_ratio)
                "status": "Delayed",
                "image": "https://marathon.in/wp-content/uploads/2022/11/Navi-Mumbai-Airport-Feature-Image.jpg"
            },
            {
                "name": "Zojila Tunnel",
                "description": "Strategic tunnel project to provide all-weather connectivity between Srinagar and Leh on the NH1 highway.",
                "projectType": "Tunnel",
                "estimatedBudget": 68000000000,
                "fundingSource": "Government of India",
                "city": "Sonamarg",
                "state": "Jammu & Kashmir",
                "country": "India",
                "zipCode": "191202",
                "areaInSqFt": 2000000,
                "teamsize": 3000,
                "startDate": (datetime.utcnow() - timedelta(days=800)).isoformat() + "Z",
                "deadline": (datetime.utcnow() + timedelta(days=700)).isoformat() + "Z",
                "utilizationPercent": 25, # Unhealthy (Delayed / Logic will trigger)
                "status": "On Hold",
                "image": "https://th-i.thgim.com/public/incoming/lin99c/article67138219.ece/alternates/LANDSCAPE_1200/6751_9_4_2023_16_8_2_2_02_ZOJILATUNNEL_SGR_09_04_2023.JPG"
            }
        ]

        inserted_count = 0
        for p_data in projects:
            project_doc = {
                "name": p_data.get("name"),
                "description": p_data.get("description"),
                "companyCode": company_code,
                "createdBy": created_by,
                "funding": {
                    "estimatedBudget": p_data.get("estimatedBudget"),
                    "fundingSource": p_data.get("fundingSource"),
                    "totalAllocated": p_data.get("estimatedBudget") * 0.8,
                    "totalSpent": p_data.get("estimatedBudget") * (p_data.get("utilizationPercent") / 100),
                    "utilizationPercent": p_data.get("utilizationPercent")
                },
                "timeline": {
                    "startDate": p_data.get("startDate"),
                    "endDate": p_data.get("deadline"), # Assuming endDate is the same as deadline for backfill
                    "deadline": p_data.get("deadline")
                },
                "status": p_data.get("status", "Planned"),
                "projectType": p_data.get("projectType"),
                "location": {
                    "city": p_data.get("city"),
                    "state": p_data.get("state"),
                    "country": p_data.get("country"),
                    "zipCode": p_data.get("zipCode"),
                    "areaInSqFt": p_data.get("areaInSqFt")
                },
                "teamsize": p_data.get("teamsize"),
                "isActive": True,
                "image": p_data.get("image"),
                "createdAt": datetime.utcnow(),
                "users": {
                    "admins": [],
                    "users": []
                }
            }
            
            result = mongo.db.projects.insert_one(project_doc)
            if result.inserted_id:
                print(f"Inserted project: {p_data['name']} (ID: {result.inserted_id})")
                inserted_count += 1
        
        print(f"\nSuccessfully backfilled {inserted_count} projects for company {company_code}.")

if __name__ == "__main__":
    backfill_projects()
