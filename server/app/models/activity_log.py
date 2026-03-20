from datetime import datetime
from bson import ObjectId


def create_activity_log_schema(actor_id, actor_name, action, company_code, project_id=None, meta=None):
    """
    action: created_project | added_fund | updated_milestone | submitted_report |
            created_announcement | added_document | updated_tags | bulk_status_update |
            created_timeline_event | added_admin
    """
    return {
        "actorId": ObjectId(actor_id) if actor_id and ObjectId.is_valid(str(actor_id)) else actor_id,
        "actorName": actor_name,
        "action": action,
        "companyCode": company_code,
        "projectId": ObjectId(project_id) if project_id and ObjectId.is_valid(project_id) else None,
        "meta": meta or {},
        "createdAt": datetime.utcnow(),
    }
