from flask import request, jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.response_util import generate_response
from app.models.announcement import create_announcement_schema, VALID_PRIORITIES
from app.utils.activity_logger import log_activity, push_notification


def create_announcement():
    """POST /infrared/api/v1/announcements/ — create announcement (owner/admin)"""
    signature = "create_announcement"
    role = (request.user_role or "").lower()
    if role not in ["owner", "admin"]:
        return jsonify(generate_response(signature, "create_announcement", "fail", error="Only owner/admin can post announcements")), 403

    data = request.get_json(silent=True) or {}
    payload = data.get("payload", data)

    project_id = payload.get("projectId")
    title = (payload.get("title") or "").strip()
    body = (payload.get("body") or "").strip()
    company_code = request.headers.get("x-company-code")

    if not project_id or not title or not body:
        return jsonify(generate_response(signature, "create_announcement", "fail", error="projectId, title, and body are required")), 400

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "create_announcement", "fail", error="Invalid project ID")), 400

    project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "companyCode": company_code})
    if not project:
        return jsonify(generate_response(signature, "create_announcement", "fail", error="Project not found")), 404

    try:
        doc = create_announcement_schema(payload, project_id, company_code, request.user_id)
        result = mongo.db.announcements.insert_one(doc)

        # Push notifications to all users in this company
        company_users = mongo.db.users.find({"companyCode": company_code}, {"_id": 1})
        for u in company_users:
            push_notification(
                str(u["_id"]),
                "announcement",
                f"📣 New announcement on '{project.get('name', 'Project')}': {title}",
                project_id=project_id,
                meta={"announcementId": str(result.inserted_id), "priority": doc.get("priority")},
            )

        log_activity(
            request.user_id, _get_actor_name(), "created_announcement",
            company_code, project_id=project_id,
            meta={"announcementId": str(result.inserted_id), "title": title}
        )

        return jsonify(generate_response(signature, "create_announcement", "success", {
            "announcement": {
                "id": str(result.inserted_id),
                "title": title,
                "priority": doc.get("priority"),
            }
        })), 201
    except Exception as e:
        return jsonify(generate_response(signature, "create_announcement", "fail", error=str(e))), 500


def get_announcements_by_project(project_id):
    """GET /infrared/api/v1/announcements/project/<project_id> — public read"""
    signature = "get_announcements_by_project"

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "get_announcements_by_project", "fail", error="Invalid project ID")), 400

    try:
        cursor = mongo.db.announcements.find(
            {"projectId": ObjectId(project_id), "isDeleted": False}
        ).sort("createdAt", -1)

        announcements = []
        for a in cursor:
            announcements.append({
                "id": str(a["_id"]),
                "title": a.get("title", ""),
                "body": a.get("body", ""),
                "priority": a.get("priority", "Normal"),
                "postedBy": str(a.get("postedBy")) if a.get("postedBy") else None,
                "createdAt": a["createdAt"].isoformat() + "Z" if a.get("createdAt") else None,
            })

        return jsonify(generate_response(signature, "get_announcements_by_project", "success", {
            "projectId": project_id,
            "announcements": announcements,
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_announcements_by_project", "fail", error=str(e))), 500


def delete_announcement(ann_id):
    """DELETE /infrared/api/v1/announcements/<ann_id> — soft delete (owner/admin)"""
    signature = "delete_announcement"
    role = (request.user_role or "").lower()
    company_code = request.headers.get("x-company-code")

    if role not in ["owner", "admin"]:
        return jsonify(generate_response(signature, "delete_announcement", "fail", error="Unauthorized")), 403

    if not ObjectId.is_valid(ann_id):
        return jsonify(generate_response(signature, "delete_announcement", "fail", error="Invalid announcement ID")), 400

    try:
        result = mongo.db.announcements.update_one(
            {"_id": ObjectId(ann_id), "companyCode": company_code},
            {"$set": {"isDeleted": True}}
        )
        if result.matched_count == 0:
            return jsonify(generate_response(signature, "delete_announcement", "fail", error="Announcement not found")), 404

        return jsonify(generate_response(signature, "delete_announcement", "success", {"deleted": ann_id})), 200
    except Exception as e:
        return jsonify(generate_response(signature, "delete_announcement", "fail", error=str(e))), 500


def _get_actor_name():
    """Convenience: fetch full name from request context."""
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(request.user_id)}, {"firstName": 1, "lastName": 1})
        if user:
            return f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
    except Exception:
        pass
    return "Unknown"
