import cloudinary
import cloudinary.uploader
from flask import request, jsonify
from bson import ObjectId
from datetime import datetime
from app.extensions import mongo
from app.utils.response_util import generate_response
from app.models.issue import create_issue_schema, VALID_SEVERITIES, VALID_ISSUE_STATUSES, VALID_ISSUE_TYPES
from app.utils.activity_logger import log_activity


def create_issue():
    """POST /infrared/api/v1/issues/ — report an issue/defect (any auth user)"""
    signature = "create_issue"
    data = request.get_json(silent=True) or {}
    payload = data.get("payload", data)
    company_code = request.headers.get("x-company-code")

    project_id = payload.get("projectId")
    title = (payload.get("title") or "").strip()

    if not project_id or not title:
        return jsonify(generate_response(signature, "create_issue", "fail", error="projectId and title are required")), 400

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "create_issue", "fail", error="Invalid project ID")), 400

    project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "companyCode": company_code})
    if not project:
        return jsonify(generate_response(signature, "create_issue", "fail", error="Project not found")), 404

    try:
        doc = create_issue_schema(payload, project_id, request.user_id)
        result = mongo.db.issues.insert_one(doc)

        log_activity(
            request.user_id, _get_actor_name(), "reported_issue",
            company_code, project_id=project_id,
            meta={"issueId": str(result.inserted_id), "title": title, "severity": doc.get("severity")}
        )

        return jsonify(generate_response(signature, "create_issue", "success", {
            "issue": {
                "id": str(result.inserted_id),
                "title": title,
                "severity": doc.get("severity"),
                "issueType": doc.get("issueType"),
                "status": "Open",
            }
        })), 201
    except Exception as e:
        return jsonify(generate_response(signature, "create_issue", "fail", error=str(e))), 500


def get_issues_by_project(project_id):
    """GET /infrared/api/v1/issues/project/<project_id>"""
    signature = "get_issues_by_project"

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "get_issues_by_project", "fail", error="Invalid project ID")), 400

    # Optional filters
    severity = request.args.get("severity")
    status = request.args.get("status")
    issue_type = request.args.get("issueType")

    query = {"projectId": ObjectId(project_id), "isDeleted": False}
    if severity and severity in VALID_SEVERITIES:
        query["severity"] = severity
    if status and status in VALID_ISSUE_STATUSES:
        query["status"] = status
    if issue_type and issue_type in VALID_ISSUE_TYPES:
        query["issueType"] = issue_type

    try:
        cursor = mongo.db.issues.find(query).sort("createdAt", -1)
        issues = [_serialize_issue(i) for i in cursor]

        # Summary stats
        all_issues = list(mongo.db.issues.find({"projectId": ObjectId(project_id), "isDeleted": False}))
        stats = {
            "total": len(all_issues),
            "open": sum(1 for i in all_issues if i.get("status") == "Open"),
            "critical": sum(1 for i in all_issues if i.get("severity") == "Critical"),
            "resolved": sum(1 for i in all_issues if i.get("status") == "Resolved"),
        }

        return jsonify(generate_response(signature, "get_issues_by_project", "success", {
            "projectId": project_id,
            "issues": issues,
            "stats": stats,
            "validSeverities": VALID_SEVERITIES,
            "validStatuses": VALID_ISSUE_STATUSES,
            "validTypes": VALID_ISSUE_TYPES,
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_issues_by_project", "fail", error=str(e))), 500


def update_issue_status(issue_id):
    """PATCH /infrared/api/v1/issues/<issue_id>/status — update status + optional resolution (owner/admin)"""
    signature = "update_issue_status"
    role = (request.user_role or "").lower()
    if role not in ["owner", "admin"]:
        return jsonify(generate_response(signature, "update_issue_status", "fail", error="Only owner/admin can update issue status")), 403

    if not ObjectId.is_valid(issue_id):
        return jsonify(generate_response(signature, "update_issue_status", "fail", error="Invalid issue ID")), 400

    data = request.get_json(silent=True) or {}
    new_status = (data.get("status") or "").strip()

    if new_status not in VALID_ISSUE_STATUSES:
        return jsonify(generate_response(signature, "update_issue_status", "fail",
                                          error=f"Invalid status. Valid: {VALID_ISSUE_STATUSES}")), 400

    try:
        issue = mongo.db.issues.find_one({"_id": ObjectId(issue_id), "isDeleted": False})
        if not issue:
            return jsonify(generate_response(signature, "update_issue_status", "fail", error="Issue not found")), 404

        update_fields = {
            "status": new_status,
            "updatedAt": datetime.utcnow(),
        }
        if new_status in ["Resolved", "Closed"]:
            update_fields["resolutionNote"] = (data.get("resolutionNote") or "").strip()
            update_fields["resolvedAt"] = datetime.utcnow()
        if data.get("assignedTo") and ObjectId.is_valid(data["assignedTo"]):
            update_fields["assignedTo"] = ObjectId(data["assignedTo"])

        mongo.db.issues.update_one({"_id": ObjectId(issue_id)}, {"$set": update_fields})
        updated = mongo.db.issues.find_one({"_id": ObjectId(issue_id)})

        return jsonify(generate_response(signature, "update_issue_status", "success", {
            "issue": _serialize_issue(updated)
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "update_issue_status", "fail", error=str(e))), 500


def delete_issue(issue_id):
    """DELETE /infrared/api/v1/issues/<issue_id> — soft delete (owner/admin)"""
    signature = "delete_issue"
    role = (request.user_role or "").lower()
    if role not in ["owner", "admin"]:
        return jsonify(generate_response(signature, "delete_issue", "fail", error="Unauthorized")), 403

    if not ObjectId.is_valid(issue_id):
        return jsonify(generate_response(signature, "delete_issue", "fail", error="Invalid issue ID")), 400

    try:
        result = mongo.db.issues.update_one(
            {"_id": ObjectId(issue_id)},
            {"$set": {"isDeleted": True}}
        )
        if result.matched_count == 0:
            return jsonify(generate_response(signature, "delete_issue", "fail", error="Issue not found")), 404

        return jsonify(generate_response(signature, "delete_issue", "success", {"deleted": issue_id})), 200
    except Exception as e:
        return jsonify(generate_response(signature, "delete_issue", "fail", error=str(e))), 500


def _serialize_issue(i):
    return {
        "id": str(i["_id"]),
        "projectId": str(i.get("projectId")) if i.get("projectId") else None,
        "title": i.get("title", ""),
        "description": i.get("description", ""),
        "severity": i.get("severity", "Medium"),
        "issueType": i.get("issueType", "Other"),
        "status": i.get("status", "Open"),
        "reportedBy": str(i.get("reportedBy")) if i.get("reportedBy") else None,
        "assignedTo": str(i.get("assignedTo")) if i.get("assignedTo") else None,
        "imageUrls": i.get("imageUrls", []),
        "location": i.get("location", ""),
        "resolutionNote": i.get("resolutionNote"),
        "resolvedAt": i["resolvedAt"].isoformat() + "Z" if i.get("resolvedAt") else None,
        "createdAt": i["createdAt"].isoformat() + "Z" if i.get("createdAt") else None,
        "updatedAt": i["updatedAt"].isoformat() + "Z" if i.get("updatedAt") else None,
    }


def _get_actor_name():
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(request.user_id)}, {"firstName": 1, "lastName": 1})
        if user:
            return f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
    except Exception:
        pass
    return "Unknown"
