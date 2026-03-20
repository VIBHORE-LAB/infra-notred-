from flask import request, jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.response_util import generate_response


def get_project_activity(project_id):
    """GET /infrared/api/v1/activity/project/<project_id>"""
    signature = "get_project_activity"

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "get_project_activity", "fail", error="Invalid project ID")), 400

    try:
        cursor = mongo.db.activity_logs.find(
            {"projectId": ObjectId(project_id)}
        ).sort("createdAt", -1).limit(200)

        logs = [_serialize_log(log) for log in cursor]

        return jsonify(generate_response(signature, "get_project_activity", "success", {
            "projectId": project_id,
            "logs": logs,
            "total": len(logs),
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_project_activity", "fail", error=str(e))), 500


def get_company_activity():
    """GET /infrared/api/v1/activity/company — company-wide audit log"""
    signature = "get_company_activity"
    company_code = getattr(request, "company_code", None) or request.headers.get("x-company-code")

    if not company_code:
        return jsonify(generate_response(signature, "get_company_activity", "fail", error="Company scope unavailable for user")), 400

    try:
        page = int(request.args.get("page", 1))
        limit = min(int(request.args.get("limit", 50)), 100)
        skip = (page - 1) * limit

        total = mongo.db.activity_logs.count_documents({"companyCode": company_code})
        cursor = mongo.db.activity_logs.find(
            {"companyCode": company_code}
        ).sort("createdAt", -1).skip(skip).limit(limit)

        logs = [_serialize_log(log) for log in cursor]

        return jsonify(generate_response(signature, "get_company_activity", "success", {
            "logs": logs,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": -(-total // limit),  # ceiling division
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_company_activity", "fail", error=str(e))), 500


def _serialize_log(log):
    return {
        "id": str(log["_id"]),
        "actorId": str(log.get("actorId")) if log.get("actorId") else None,
        "actorName": log.get("actorName", ""),
        "action": log.get("action", ""),
        "companyCode": log.get("companyCode", ""),
        "projectId": str(log["projectId"]) if log.get("projectId") else None,
        "meta": log.get("meta", {}),
        "createdAt": log["createdAt"].isoformat() + "Z" if log.get("createdAt") else None,
    }
