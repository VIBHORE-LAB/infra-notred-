from datetime import datetime
from bson import ObjectId

VALID_EVENT_TYPES = [
    "Milestone",
    "Inspection",
    "Tender",
    "Groundbreaking",
    "Completion",
    "Survey",
    "Environmental",
    "Legal",
    "Other",
]


def create_timeline_event_schema(data, project_id, created_by):
    event_type = data.get("eventType", "Other")
    if event_type not in VALID_EVENT_TYPES:
        event_type = "Other"
    return {
        "projectId": ObjectId(project_id),
        "title": data.get("title", "").strip(),
        "description": data.get("description", "").strip(),
        "eventType": event_type,
        "eventDate": data.get("eventDate"),          # ISO string from client
        "attachmentUrl": data.get("attachmentUrl"),
        "createdBy": ObjectId(created_by) if ObjectId.is_valid(str(created_by)) else created_by,
        "createdAt": datetime.utcnow(),
        "isDeleted": False,
    }
