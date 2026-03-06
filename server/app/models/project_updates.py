from datetime import datetime
from bson import ObjectId


def create_project_update_schema(data, project_id, updated_by):
    if not ObjectId.is_valid(project_id):
        raise ValueError("Invalid project ID format")

    updated_by_object_id = ObjectId(updated_by) if ObjectId.is_valid(updated_by) else updated_by
    now = datetime.utcnow()

    return {
        "projectId": ObjectId(project_id),
        "updateType": data.get("updateType"),
        "title": data.get("title"),
        "description": data.get("description"),
        "updatedBy": updated_by_object_id,
        "createdAt": now,
        "timestamp": now,
        "attachments": data.get("attachments", [])
    }
