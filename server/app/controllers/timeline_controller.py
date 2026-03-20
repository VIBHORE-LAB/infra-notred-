from flask import request, jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.response_util import generate_response
from app.models.timeline_event import create_timeline_event_schema, VALID_EVENT_TYPES
from app.utils.activity_logger import log_activity


def create_event():
    """POST /infrared/api/v1/timeline/ — create a timeline event (owner/admin)"""
    signature = "create_timeline_event"
    role = (request.user_role or "").lower()
    if role not in ["owner", "admin"]:
        return jsonify(generate_response(signature, "create_timeline_event", "fail", error="Only owner/admin can add timeline events")), 403

    data = request.get_json(silent=True) or {}
    payload = data.get("payload", data)
    company_code = request.headers.get("x-company-code")

    project_id = payload.get("projectId")
    title = (payload.get("title") or "").strip()
    event_date = payload.get("eventDate")

    if not project_id or not title or not event_date:
        return jsonify(generate_response(signature, "create_timeline_event", "fail", error="projectId, title, and eventDate are required")), 400

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "create_timeline_event", "fail", error="Invalid project ID")), 400

    project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "companyCode": company_code})
    if not project:
        return jsonify(generate_response(signature, "create_timeline_event", "fail", error="Project not found")), 404

    try:
        doc = create_timeline_event_schema(payload, project_id, request.user_id)
        result = mongo.db.timeline_events.insert_one(doc)

        log_activity(
            request.user_id, _get_actor_name(), "created_timeline_event",
            company_code, project_id=project_id,
            meta={"eventId": str(result.inserted_id), "title": title, "eventType": doc.get("eventType")}
        )

        return jsonify(generate_response(signature, "create_timeline_event", "success", {
            "event": {
                "id": str(result.inserted_id),
                "title": title,
                "eventType": doc.get("eventType"),
                "eventDate": event_date,
            }
        })), 201
    except Exception as e:
        return jsonify(generate_response(signature, "create_timeline_event", "fail", error=str(e))), 500


def get_events_by_project(project_id):
    """GET /infrared/api/v1/timeline/project/<project_id>"""
    signature = "get_timeline_events"

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "get_timeline_events", "fail", error="Invalid project ID")), 400

    try:
        cursor = mongo.db.timeline_events.find(
            {"projectId": ObjectId(project_id), "isDeleted": False}
        ).sort("eventDate", 1)

        events = [_serialize_event(e) for e in cursor]

        return jsonify(generate_response(signature, "get_timeline_events", "success", {
            "projectId": project_id,
            "events": events,
            "validEventTypes": VALID_EVENT_TYPES,
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_timeline_events", "fail", error=str(e))), 500


def delete_event(event_id):
    """DELETE /infrared/api/v1/timeline/<event_id>"""
    signature = "delete_timeline_event"
    role = (request.user_role or "").lower()
    if role not in ["owner", "admin"]:
        return jsonify(generate_response(signature, "delete_timeline_event", "fail", error="Unauthorized")), 403

    if not ObjectId.is_valid(event_id):
        return jsonify(generate_response(signature, "delete_timeline_event", "fail", error="Invalid event ID")), 400

    try:
        result = mongo.db.timeline_events.update_one(
            {"_id": ObjectId(event_id)},
            {"$set": {"isDeleted": True}}
        )
        if result.matched_count == 0:
            return jsonify(generate_response(signature, "delete_timeline_event", "fail", error="Event not found")), 404

        return jsonify(generate_response(signature, "delete_timeline_event", "success", {"deleted": event_id})), 200
    except Exception as e:
        return jsonify(generate_response(signature, "delete_timeline_event", "fail", error=str(e))), 500


def _serialize_event(e):
    return {
        "id": str(e["_id"]),
        "projectId": str(e.get("projectId")) if e.get("projectId") else None,
        "title": e.get("title", ""),
        "description": e.get("description", ""),
        "eventType": e.get("eventType", "Other"),
        "eventDate": e.get("eventDate"),
        "attachmentUrl": e.get("attachmentUrl"),
        "createdBy": str(e.get("createdBy")) if e.get("createdBy") else None,
        "createdAt": e["createdAt"].isoformat() + "Z" if e.get("createdAt") else None,
    }


def _get_actor_name():
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(request.user_id)}, {"firstName": 1, "lastName": 1})
        if user:
            return f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
    except Exception:
        pass
    return "Unknown"
