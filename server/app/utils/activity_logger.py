from app.extensions import mongo
from app.models.activity_log import create_activity_log_schema
from bson import ObjectId


def log_activity(actor_id, actor_name, action, company_code, project_id=None, meta=None):
    """
    Lightweight helper to insert an activity log entry.
    Call this from any controller after a meaningful write operation.
    """
    try:
        doc = create_activity_log_schema(
            actor_id=actor_id,
            actor_name=actor_name,
            action=action,
            company_code=company_code,
            project_id=project_id,
            meta=meta,
        )
        mongo.db.activity_logs.insert_one(doc)
    except Exception:
        # Never let activity logging crash the main request
        pass


def push_notification(user_id, notif_type, message, project_id=None, meta=None):
    """
    Lightweight helper to push a notification to a user.
    """
    try:
        from app.models.notification import create_notification_schema
        doc = create_notification_schema(
            user_id=str(user_id),
            notif_type=notif_type,
            message=message,
            project_id=str(project_id) if project_id else None,
            meta=meta,
        )
        mongo.db.notifications.insert_one(doc)
    except Exception:
        pass
