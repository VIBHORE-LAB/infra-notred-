import os
import random
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    print("Error: MONGO_URI not found in .env file")
    exit(1)

client = MongoClient(MONGO_URI)
db = client["infradb"] # Specify 'infradb' database

def seed_activities(company_code, actor_id, actor_name):
    print(f"--- Seeding Demo Data for Company: {company_code} ---")
    
    projects = list(db.projects.find({"companyCode": company_code}))
    if not projects:
        print(f"No projects found for company {company_code}")
        return

    actions = [
        "updated_milestone", "added_fund", "submitted_report", 
        "created_announcement", "added_document", "updated_tags",
        "created_timeline_event", "bulk_status_update"
    ]
    
    logs_to_insert = []
    reports_to_insert = []
    announcements_to_insert = []
    
    now = datetime.utcnow()
    
    for project in projects:
        pid = project["_id"]
        pname = project.get("name", "Project")
        print(f"Processing project: {pname} ({pid})")
        
        # 1. Activity Logs
        for _ in range(random.randint(5, 10)):
            action = random.choice(actions)
            days_ago = random.randint(0, 30)
            created_at = now - timedelta(days=days_ago, hours=random.randint(0, 23))
            
            logs_to_insert.append({
                "actorId": ObjectId(actor_id) if ObjectId.is_valid(actor_id) else actor_id,
                "actorName": actor_name,
                "action": action,
                "companyCode": company_code,
                "projectId": pid,
                "meta": {
                    "note": f"System generated activity for {pname}",
                    "milestone": f"Phase {random.randint(1,4)}",
                    "status": random.choice(["On track", "Delayed", "Reviewing"])
                },
                "createdAt": created_at
            })

        # 2. Progress Reports
        for _ in range(random.randint(1, 3)):
            reports_to_insert.append({
                "projectId": pid,
                "uploadedBy": ObjectId(actor_id) if ObjectId.is_valid(actor_id) else actor_id,
                "description": f"Site update for {pname}: Construction is progressing as per schedule. Quality checks passed for current phase.",
                "gpsCoordinates": {
                    "latitude": project.get("location", {}).get("latitude", 28.6139) + random.uniform(-0.01, 0.01),
                    "longitude": project.get("location", {}).get("longitude", 77.2090) + random.uniform(-0.01, 0.01)
                },
                "images": [
                    "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&w=800&q=80",
                    "https://images.unsplash.com/photo-1503387762-592dea58ef21?auto=format&fit=crop&w=800&q=80"
                ],
                "timestamp": now - timedelta(days=random.randint(1, 14)),
                "createdAt": now - timedelta(days=random.randint(1, 14))
            })

        # 3. Announcements
        announcements_to_insert.append({
            "projectId": pid,
            "title": f"New Safety Guidelines for {pname}",
            "content": "Please ensure all team members follow the updated safety protocols effective immediately. PPE is mandatory at all times.",
            "priority": "High",
            "createdBy": ObjectId(actor_id) if ObjectId.is_valid(actor_id) else actor_id,
            "companyCode": company_code,
            "createdAt": now - timedelta(days=random.randint(1, 5))
        })

    if logs_to_insert:
        db.activity_logs.insert_many(logs_to_insert)
    if reports_to_insert:
        db.progress_reports.insert_many(reports_to_insert)
    if announcements_to_insert:
        db.announcements.insert_many(announcements_to_insert)

    print(f"\nSuccessfully seeded:")
    print(f"- {len(logs_to_insert)} Activity Logs")
    print(f"- {len(reports_to_insert)} Progress Reports")
    print(f"- {len(announcements_to_insert)} Announcements")

if __name__ == "__main__":
    # You can change these values as needed
    COMPANY_CODE = "EZ8I2N" # Default from backfill_projects
    ACTOR_ID = "69ab0c0f07179d2fc2d98e2a"
    ACTOR_NAME = "Infrared Admin"
    
    seed_activities(COMPANY_CODE, ACTOR_ID, ACTOR_NAME)
