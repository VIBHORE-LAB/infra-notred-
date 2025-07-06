from flask import request,jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.response_util import generate_response
from app.models.project import create_project_schema
from app.middlewares.auth_middleware import Authenticator

def create_project():
    data = request.json
    signature = data.get("req", {}).get("signature", "unknown_signature")
    payload = data.get("payload", {})
    
    if request.user_role.lower() != "owner":
        return jsonify(generate_response(
            signature,
            "create_project",
            "fail",
            error = "unauthorized: only owner can create a project"
        )), 403
        
    company_code = request.headers.get("x-company-code") or payload.get("companyId")
    created_by = request.user_id
    
    if not company_code: 
        return jsonify(generate_response(
            signature,
            "create_project",
            "fail",
            error = "missing or invalid company code"
        )), 400

    company = mongo.db.companies.find_one({"code": company_code})
    if not company:
        return jsonify(generate_response(
            signature,
            "create_project",
            "fail",
            error = "company not found"
            
        )), 404
    
    company_id = company["_id"]
    created_by = request.user_id
    
    required_fields = [
        "name", "description", "estimatedBudget", "fundingSource",
        "startDate", "endDate", "deadline",
        "status", "projectType",
        "city", "state", "country", "zipCode", "areaInSqFt"
    ]
    
    missing_fields = [field for field in required_fields if not payload.get(field)]
    if missing_fields:
        return jsonify(generate_response(
            signature,
            "create_project",
            "fail",
            error = f"missing required fields: {', '.join(missing_fields)}"
        )), 400
    
    try:
        project_data = create_project_schema(payload, created_by, company_id)
    except ValueError as e:
        return jsonify(generate_response(
            signature,
            "create_project",
            "fail",
            error = str(e)
        )), 400
        
    result = mongo.db.projects.insert_one(project_data)
    
    return jsonify(generate_response(
        signature,
        "create_project",
        "success",
        {
            "project": {
                "id": str(result.inserted_id),
                "name": project_data["name"],
                "description": project_data["description"],
                "companyId": str(company_id),
                "createdBy": created_by,
                "status": project_data["status"]
            }
        }
    )), 201      
    
    
    
# def get_project_by_id(project_id):
    