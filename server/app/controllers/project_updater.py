from flask import request, jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.response_util import generate_response
from app.models.project_updates import create_project_update_schema
from app.middlewares.image_uploader import validate_and_upload_images
import json


def create_project_update():
    signature = "create_project_update"

    try:
        data = {}
        if request.content_type and "multipart/form-data" in request.content_type:
            req_meta = json.loads(request.form.get("req", "{}"))
            payload = json.loads(request.form.get("payload", "{}"))
            files = request.files.getlist("attachments")
        else:
            data = request.get_json(silent=True) or {}
            req_meta = data.get("req", {})
            payload = data.get("payload", data)
            files = []
        signature = req_meta.get("signature") or data.get("signature", "create_project_update")
    except Exception as e:
        return jsonify(generate_response(
            signature,
            "create_project_update",
            "fail",
            error=f"Invalid request payload: {str(e)}"
        )), 400

    role = (request.user_role or "").lower()
    if role not in ["owner", "admin"]:
        return jsonify(generate_response(
            signature,
            "create_project_update",
            "fail",
            error="unauthorized: only owner or admins can create a project update"
        )), 403

    company_code = request.headers.get("x-company-code")
    if not company_code:
        return jsonify(generate_response(
            signature,
            "create_project_update",
            "fail",
            error="missing company code"
        )), 400

    project_id = payload.get("projectId")
    if not project_id or not ObjectId.is_valid(project_id):
        return jsonify(generate_response(
            signature,
            "create_project_update",
            "fail",
            error="invalid or missing project ID"
        )), 400

    project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "companyCode": company_code})
    if not project:
        return jsonify(generate_response(
            signature,
            "create_project_update",
            "fail",
            error="No project exists for the particular company"
        )), 404

    title = payload.get("title")
    description = payload.get("description")
    update_type = payload.get("updateType")

    if not title or not description or not update_type:
        return jsonify(generate_response(
            signature,
            "create_project_update",
            "fail",
            error="Title, Description, and updateType are required"
        )), 400

    image_urls, error_response, status_code = validate_and_upload_images(signature, files)
    if error_response:
        return error_response, status_code

    update_payload = {
        "projectId": project_id,
        "title": title,
        "description": description,
        "updateType": update_type,
        "attachments": image_urls or payload.get("attachments", []) or []
    }

    updated_by = request.user_id

    try:
        update_doc = create_project_update_schema(update_payload, project_id, updated_by)
        result = mongo.db.project_updates.insert_one(update_doc)

        return jsonify(generate_response(
            signature,
            "create_project_update",
            "success",
            data={"updateId": str(result.inserted_id)}
        )), 201

    except Exception as e:
        return jsonify(generate_response(
            signature,
            "create_project_update",
            "fail",
            error="failed to insert project update",
            data=str(e)
        )), 500




def get_project_update(update_id):
    
    signature = request.args.get("signature", "get_project_update_by_id")

    if not ObjectId.is_valid(update_id):
        return jsonify(generate_response(signature,"get_project_update_by_id","fail",error="Project Update id is not a valid format for an Id")),404
    
    try:
        update = mongo.db.project_updates.find_one({
            
            "_id": ObjectId(update_id),
        })
        
        if not update:
            return jsonify(generate_response(
                signature,
                "get_project_update_by_id",
                "fail",
                error = "Project update not found"
                
            )),404
            
        update["_id"] = str(update["_id"])
        update["projectId"] = str(update.get("projectId", ""))
        if "updatedBy" in update and isinstance(update["updatedBy"], ObjectId):
            update["updatedBy"] = str(update["updatedBy"])
        if "createdAt" in update and update["createdAt"]:
            update["createdAt"] = update["createdAt"].isoformat()
        if "timestamp" in update and update["timestamp"]:
            update["timestamp"] = update["timestamp"].isoformat()

        return jsonify(generate_response(
            signature,
            "get_project_update_by_id",
            "success",
            data={"projectUpdate": update}
        )), 200

    except Exception as e:
        return jsonify(generate_response(
            signature,
            "get_project_update_by_id",
            "fail",
            error="Internal server error",
            data=str(e)
        )), 500


def get_project_updates_by_project(project_id):
    signature = "get_project_updates_by_project"

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "get_project_updates_by_project", "fail", error="Invalid project ID format")), 400

    try:
        cursor = mongo.db.project_updates.find({"projectId": ObjectId(project_id)}).sort("createdAt", -1)
        updates = []
        for u in cursor:
            updates.append({
                "id": str(u["_id"]),
                "projectId": str(u["projectId"]),
                "title": u.get("title", ""),
                "description": u.get("description", u.get("descrption", "")),
                "updateType": u.get("updateType", ""),
                "attachments": u.get("attachments", []),
                "createdAt": u["createdAt"].isoformat() if "createdAt" in u else (u["timestamp"].isoformat() if "timestamp" in u else None),
            })
        return jsonify(generate_response(signature, "get_project_updates_by_project", "success", data={"updates": updates})), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_project_updates_by_project", "fail", error=str(e))), 500
