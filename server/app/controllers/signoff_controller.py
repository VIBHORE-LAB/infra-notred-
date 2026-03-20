from flask import request, jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.response_util import generate_response
from app.models.signoff import create_signoff_schema, VALID_SIGNOFF_TYPES
from app.utils.activity_logger import log_activity, push_notification


def create_signoff():
    """POST /infrared/api/v1/signoffs/ — create a sign-off/approval (owner/admin only)"""
    signature = "create_signoff"
    role = (request.user_role or "").lower()
    if role not in ["owner", "admin"]:
        return jsonify(generate_response(signature, "create_signoff", "fail", error="Only owner/admin can issue sign-offs")), 403

    data = request.get_json(silent=True) or {}
    payload = data.get("payload", data)
    company_code = request.headers.get("x-company-code")

    project_id = payload.get("projectId")
    title = (payload.get("title") or "").strip()

    if not project_id or not title:
        return jsonify(generate_response(signature, "create_signoff", "fail", error="projectId and title are required")), 400

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "create_signoff", "fail", error="Invalid project ID")), 400

    project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "companyCode": company_code})
    if not project:
        return jsonify(generate_response(signature, "create_signoff", "fail", error="Project not found")), 404

    try:
        doc = create_signoff_schema(payload, project_id, request.user_id)
        result = mongo.db.signoffs.insert_one(doc)

        log_activity(
            request.user_id, _get_actor_name(), "issued_signoff",
            company_code, project_id=project_id,
            meta={"signoffId": str(result.inserted_id), "signoffType": doc.get("signoffType"), "title": title}
        )

        # Notify all company users about the sign-off
        company_users = mongo.db.users.find({"companyCode": company_code}, {"_id": 1})
        for u in company_users:
            push_notification(
                str(u["_id"]),
                "signoff",
                f"✅ Sign-off issued for '{project.get('name', 'Project')}': {title}",
                project_id=project_id,
                meta={"signoffId": str(result.inserted_id), "signoffType": doc.get("signoffType")}
            )

        return jsonify(generate_response(signature, "create_signoff", "success", {
            "signoff": {
                "id": str(result.inserted_id),
                "title": title,
                "signoffType": doc.get("signoffType"),
                "signedAt": doc["signedAt"].isoformat() + "Z",
                "isPublic": doc.get("isPublic", False),
            }
        })), 201
    except Exception as e:
        return jsonify(generate_response(signature, "create_signoff", "fail", error=str(e))), 500


def get_signoffs_by_project(project_id):
    """GET /infrared/api/v1/signoffs/project/<project_id> — list all sign-offs (auth users see all, public sees only isPublic=True)"""
    signature = "get_signoffs_by_project"

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "get_signoffs_by_project", "fail", error="Invalid project ID")), 400

    # If called from public (no auth header), only show public sign-offs
    is_public = request.headers.get("Authorization") is None
    query = {"projectId": ObjectId(project_id)}
    if is_public:
        query["isPublic"] = True

    try:
        cursor = mongo.db.signoffs.find(query).sort("signedAt", -1)
        signoffs = [_serialize_signoff(s) for s in cursor]

        return jsonify(generate_response(signature, "get_signoffs_by_project", "success", {
            "projectId": project_id,
            "signoffs": signoffs,
            "total": len(signoffs),
            "validSignoffTypes": VALID_SIGNOFF_TYPES,
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_signoffs_by_project", "fail", error=str(e))), 500


def _serialize_signoff(s):
    return {
        "id": str(s["_id"]),
        "projectId": str(s.get("projectId")) if s.get("projectId") else None,
        "signoffType": s.get("signoffType"),
        "title": s.get("title", ""),
        "remarks": s.get("remarks", ""),
        "signedBy": str(s.get("signedBy")) if s.get("signedBy") else None,
        "signedAt": s["signedAt"].isoformat() + "Z" if s.get("signedAt") else None,
        "attachmentUrl": s.get("attachmentUrl"),
        "isPublic": s.get("isPublic", False),
    }


def _get_actor_name():
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(request.user_id)}, {"firstName": 1, "lastName": 1})
        if user:
            return f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
    except Exception:
        pass
    return "Unknown"
