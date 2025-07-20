from flask import request, jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.response_util import generate_response
from app.models.project_updates import create_project_update_schema
from app.middlewares.image_uploader import validate_and_upload_images
import json

def create_project_update():
    try:
        data = json.loads(request.form.get("req", '{}'))
        payload = json.loads(request.form.get("payload", '{}'))
        signature = data.get("signature", "unknown_signature")
    except Exception as e:
        return jsonify({"error": "Invalid JSON in form-data fields", "details": str(e)}), 400

    role = request.user_role
    if role.lower() not in ["owner", "admin"]:
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

    company = mongo.db.companies.find_one({"code": company_code})
    if not company:
        return jsonify(generate_response(
            signature,
            "create_project_update",
            "fail",
            error="company not found"
        )), 404

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
    updateType = payload.get("updateType")

    if not title or not description or not updateType:
        return jsonify(generate_response(
            signature,
            "create_project_update",
            "fail",
            error="Title, Description, and updateType are required"
        )), 400

    files = request.files.getlist("attachments")
    image_urls, error_response, status_code = validate_and_upload_images(signature, files)

    if error_response:
        return error_response, status_code

    payload = {
        "projectId": project_id,
        "title": title,
        "descrption": description,
        "updateType": updateType,
        "attachments": image_urls or []
    }

    updated_by = request.user_id

    try:
        update_doc = create_project_update_schema(payload, project_id, updated_by)
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

    
    