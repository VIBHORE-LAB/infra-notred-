from datetime import datetime
from bson import ObjectId


def create_notification_schema(user_id, notif_type, message, project_id=None, meta=None):
    """
    notif_type: milestone_updated | fund_added | report_submitted |
                announcement | project_created | tag_added | document_uploaded
    """
    return {
        "userId": ObjectId(user_id) if ObjectId.is_valid(str(user_id)) else user_id,
        "type": notif_type,
        "message": message,
        "projectId": ObjectId(project_id) if project_id and ObjectId.is_valid(project_id) else None,
        "meta": meta or {},
        "isRead": False,
        "createdAt": datetime.utcnow(),
    }
