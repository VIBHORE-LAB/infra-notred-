from flask import request, jsonify
from bson import ObjectId
from app.extensions import mongo
from app.models.milestone import create_milestone_schema
from app.utils.milestone_enums import Milestones
from app.utils.response_util import generate_response


def create_milestone():
    data = request.get_json(silent=True) or {}
    payload = data.get("payload", data)
    req_meta = data.get("req", {})
    project_id = payload.get("projectId")
    signature = req_meta.get("signature") or data.get("signature", "create_milestone")

    role = (request.user_role or "").lower()
    if role not in ["owner", "admin"]:
        return jsonify(generate_response(signature, "create_milestone", "fail", error="Unauthorized: only owner or admins can create milestones")), 403

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature,"create_milestone","fail",error="Invalid project ID")), 400
    
    companyCode = request.headers.get('x-company-code')
    if not companyCode:
        return jsonify(generate_response(signature,"create_milestone","fail",error="Company code is required")), 400
    
    project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "companyCode": companyCode})
    if not project:
        return jsonify(generate_response(signature,"create_milestone","fail",error="Project not found")), 404
    
    created_by = request.user_id

    try:
        status = payload.get("status", Milestones.PLANNED.value)
        if status not in Milestones.list():
            status = Milestones.PLANNED.value

        milestone_data = create_milestone_schema(
            data=payload,
            project_id=project_id,
            created_by=created_by,
            status=status,
        )
        mongo.db.milestones.insert_one(milestone_data)
        
        # Convert ObjectId for JSON serialization
        milestone_data["id"] = str(milestone_data["_id"])
        milestone_data["projectId"] = str(milestone_data["projectId"])
        milestone_data["createdBy"] = str(milestone_data["createdBy"])
        del milestone_data["_id"]
        if "createdAt" in milestone_data:
            milestone_data["createdAt"] = milestone_data["createdAt"].isoformat()
        if "lastUpdatedAt" in milestone_data:
            milestone_data["lastUpdatedAt"] = milestone_data["lastUpdatedAt"].isoformat()

        return jsonify(generate_response(signature,"create_milestone","success",data=milestone_data)), 201
    except Exception as e:
        return jsonify(generate_response(signature,"create_milestone","fail",error=str(e))), 500


def get_milestones_by_project(project_id):
    signature = "get_milestones_by_project"

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "get_milestones_by_project", "fail", error="Invalid project ID")), 400

    try:
        cursor = mongo.db.milestones.find({"projectId": ObjectId(project_id)}).sort("startDate", 1)
        milestones = []
        for m in cursor:
            milestones.append({
                "id": str(m["_id"]),
                "projectId": str(m["projectId"]),
                "title": m.get("title", ""),
                "description": m.get("description", ""),
                "startDate": m.get("startDate", ""),
                "endDate": m.get("endDate", ""),
                "status": m.get("status", ""),
                "progress": m.get("progress", 0),
                "createdAt": m["createdAt"].isoformat() if "createdAt" in m else None,
            })
        return jsonify(generate_response(signature, "get_milestones_by_project", "success", data={"milestones": milestones})), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_milestones_by_project", "fail", error=str(e))), 500
