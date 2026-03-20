from datetime import datetime
from bson import ObjectId

VALID_PRIORITIES = ["Normal", "Urgent", "Critical"]


def create_announcement_schema(data, project_id, company_code, posted_by):
    priority = data.get("priority", "Normal")
    if priority not in VALID_PRIORITIES:
        priority = "Normal"
    return {
        "projectId": ObjectId(project_id),
        "companyCode": company_code,
        "title": data.get("title", "").strip(),
        "body": data.get("body", "").strip(),
        "priority": priority,
        "postedBy": ObjectId(posted_by) if ObjectId.is_valid(str(posted_by)) else posted_by,
        "createdAt": datetime.utcnow(),
        "isDeleted": False,
    }
