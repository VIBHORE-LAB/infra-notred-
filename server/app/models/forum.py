from datetime import datetime
from bson import ObjectId


def create_forum_post_schema(data: dict):
    return {
        "title": data.get("title", "").strip(),
        "content": data.get("content", "").strip(),
        "authorName": data.get("authorName", "Anonymous").strip() or "Anonymous",
        "projectId": ObjectId(data["projectId"]) if data.get("projectId") and ObjectId.is_valid(data.get("projectId")) else None,
        "tags": data.get("tags", []),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "commentCount": 0,
        "isDeleted": False,
    }


def create_forum_comment_schema(data: dict):
    return {
        "content": data.get("content", "").strip(),
        "authorName": data.get("authorName", "Anonymous").strip() or "Anonymous",
        "createdAt": datetime.utcnow(),
    }
