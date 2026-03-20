from datetime import datetime
from bson import ObjectId


def create_watchlist_entry_schema(user_id, project_id):
    """One entry per user per project — checked via upsert."""
    return {
        "userId": str(user_id),          # anonymous string for public users
        "projectId": ObjectId(project_id),
        "savedAt": datetime.utcnow(),
    }
