from datetime import datetime
from bson import ObjectId


def create_project_update_schema(data, project_id, updated_by):
    if not ObjectId.is_valid(project_id):
        raise ValueError("Invalid project ID format")
    
    return {
        "projectId": ObjectId(project_id),
        "updateType": data.get("updateType"),
        "title": data.get("title"),
        "description": data.get("description"),
        "updatedBy": updated_by,
        "timestamp": datetime.utcnow(),
        "attachments": data.get("attachments", [])
    }