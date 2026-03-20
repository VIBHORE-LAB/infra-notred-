from datetime import datetime
from bson import ObjectId


def create_discussion_thread_schema(data, project_id):
    return {
        "projectId": ObjectId(project_id),
        "title": data.get("title", "").strip(),
        "body": data.get("body", "").strip(),
        "authorName": (data.get("authorName") or "Anonymous Citizen").strip() or "Anonymous Citizen",
        "replies": [],
        "upvoterIds": [],
        "upvoteCount": 0,
        "createdAt": datetime.utcnow(),
        "isDeleted": False,
    }


def create_discussion_reply_schema(data):
    return {
        "_id": ObjectId(),
        "body": data.get("body", "").strip(),
        "authorName": (data.get("authorName") or "Anonymous Citizen").strip() or "Anonymous Citizen",
        "upvoterIds": [],
        "upvoteCount": 0,
        "createdAt": datetime.utcnow(),
    }
