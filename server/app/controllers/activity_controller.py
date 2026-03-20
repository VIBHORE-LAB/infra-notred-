import random
from datetime import datetime, timedelta
from flask import request, jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.response_util import generate_response


def get_project_activity(project_id):
    """GET /infrared/api/v1/activity/project/<project_id>"""
    signature = "get_project_activity"

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "get_project_activity", "fail", error="Invalid project ID")), 400

    try:
        cursor = mongo.db.activity_logs.find(
            {"projectId": ObjectId(project_id)}
        ).sort("createdAt", -1).limit(200)

        logs = [_serialize_log(log) for log in cursor]

        return jsonify(generate_response(signature, "get_project_activity", "success", {
            "projectId": project_id,
            "logs": logs,
            "total": len(logs),
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_project_activity", "fail", error=str(e))), 500


def get_company_activity():
    """GET /infrared/api/v1/activity/company — company-wide audit log"""
    signature = "get_company_activity"
    company_code = getattr(request, "company_code", None) or request.headers.get("x-company-code")

    if not company_code:
        return jsonify(generate_response(signature, "get_company_activity", "fail", error="Company scope unavailable for user")), 400

    try:
        page = int(request.args.get("page", 1))
        limit = min(int(request.args.get("limit", 50)), 100)
        skip = (page - 1) * limit

        total = mongo.db.activity_logs.count_documents({"companyCode": company_code})
        cursor = mongo.db.activity_logs.find(
            {"companyCode": company_code}
        ).sort("createdAt", -1).skip(skip).limit(limit)

        logs = [_serialize_log(log) for log in cursor]

        return jsonify(generate_response(signature, "get_company_activity", "success", {
            "logs": logs,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": -(-total // limit),  # ceiling division
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_company_activity", "fail", error=str(e))), 500


def seed_demo_data():
    """POST /infrared/api/v1/activity/seed-demo"""
    signature = "seed_demo_data"
    company_code = request.headers.get("x-company-code")
    actor_id = request.user_id
    actor_name = getattr(request, "user_name", "Team Member")

    if not company_code:
        return jsonify(generate_response(signature, "seed_demo_data", "fail", error="Company code required")), 400

    try:
        projects = list(mongo.db.projects.find({"companyCode": company_code}))
        if not projects:
            return jsonify(generate_response(signature, "seed_demo_data", "fail", error="No projects found to seed data for")), 404

        actions = [
            "updated_milestone", "added_fund", "submitted_report", 
            "created_announcement", "added_document", "updated_tags"
        ]
        
        logs_to_insert = []
        reports_to_insert = []
        announcements_to_insert = []
        
        now = datetime.utcnow()
        
        for project in projects:
            pid = project["_id"]
            pname = project.get("name", "Project")
            
            # Create 5-8 activity logs per project
            for i in range(random.randint(5, 8)):
                action = random.choice(actions)
                days_ago = random.randint(0, 14)
                created_at = now - timedelta(days=days_ago, hours=random.randint(0, 23))
                
                logs_to_insert.append({
                    "actorId": ObjectId(actor_id) if ObjectId.is_valid(actor_id) else actor_id,
                    "actorName": actor_name,
                    "action": action,
                    "companyCode": company_code,
                    "projectId": pid,
                    "meta": {"note": f"Automated demo data for {pname}"},
                    "createdAt": created_at
                })

            # Create 1-2 progress reports
            for i in range(random.randint(1, 2)):
                reports_to_insert.append({
                    "projectId": pid,
                    "uploadedBy": ObjectId(actor_id) if ObjectId.is_valid(actor_id) else actor_id,
                    "description": f"Weekly site inspection for {pname}. Foundation work in progress.",
                    "gpsCoordinates": {"latitude": 28.6139 + random.uniform(-0.1, 0.1), "longitude": 77.2090 + random.uniform(-0.1, 0.1)},
                    "images": ["https://images.unsplash.com/photo-1503387762-592dea58ef21?auto=format&fit=crop&w=800&q=80"],
                    "timestamp": now - timedelta(days=random.randint(1, 7)),
                    "createdAt": now - timedelta(days=random.randint(1, 7))
                })

            # Create 1 announcement
            announcements_to_insert.append({
                "projectId": pid,
                "title": f"Safety Milestone Reached: {pname}",
                "content": "We have completed 100,000 man-hours without any lost time injuries. Great job team!",
                "priority": "Normal",
                "createdBy": ObjectId(actor_id) if ObjectId.is_valid(actor_id) else actor_id,
                "companyCode": company_code,
                "createdAt": now - timedelta(days=2)
            })

        if logs_to_insert: mongo.db.activity_logs.insert_many(logs_to_insert)
        if reports_to_insert: mongo.db.progress_reports.insert_many(reports_to_insert)
        if announcements_to_insert: mongo.db.announcements.insert_many(announcements_to_insert)

        return jsonify(generate_response(signature, "seed_demo_data", "success", {
            "message": f"Successfully seeded data for {len(projects)} projects",
            "logsCreated": len(logs_to_insert),
            "reportsCreated": len(reports_to_insert)
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "seed_demo_data", "fail", error=str(e))), 500


def _serialize_log(log):
    return {
        "id": str(log["_id"]) if "_id" in log else None,
        "actorId": str(log.get("actorId")) if log.get("actorId") else None,
        "actorName": log.get("actorName", ""),
        "action": log.get("action", ""),
        "companyCode": log.get("companyCode", ""),
        "projectId": str(log["projectId"]) if log.get("projectId") else None,
        "meta": log.get("meta", {}),
        "createdAt": log["createdAt"].isoformat() + "Z" if log.get("createdAt") and hasattr(log["createdAt"], 'isoformat') else None,
    }
