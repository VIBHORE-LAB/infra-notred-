from flask import request,jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.response_util import generate_response
from app.models.project_updates import create_project_update_schema


def create_project_update():
    data = request.json
    signature = data.get("req", {}).get("signature", "unknown_signature")
    payload = data.get("payload", {})
    role = request.user_role
    if(role.lower() != "owner" and role.lower() != "admin"):
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
        ))
    
    company = mongo.db.companies.find_one({"code": company_code})
    if not company:
        return jsonify(generate_response(
            signature,
            "create_project_update",
            "fail",
            error="company not found"
        ))
    
    project_id = payload.get("projectId")
    if not project_id or not ObjectId.is_valid(project_id):
        return jsonify(generate_response(
            signature,
            "create_project_update",
            "fail",
            error="invalid or missing project ID"
        )), 400
    
    