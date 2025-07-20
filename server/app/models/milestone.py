from datetime import datetime
from bson import ObjectId
from app.utils.milestone_enums import Milestones

def create_milestone_schema(data, project_id, created_by, status = Milestones.PLANNED.value):
    if not ObjectId.is_valid(project_id):
        raise ValueError("Invalid project ID")

    return {
        "projectId": ObjectId(project_id),
        "title": data.get("title"),
        "description": data.get("description", ""),
        "startDate": data.get("startDate"),  
        "endDate": data.get("endDate"),
        "status": status,
        "progress": data.get("progress", 0),  
        "createdBy": ObjectId(created_by),
        "createdAt": datetime.utcnow(),
        "lastUpdatedAt": datetime.utcnow(),
        "remarks": []
    }
