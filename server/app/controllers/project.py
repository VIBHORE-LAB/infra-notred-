from flask import request,jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.response_util import generate_response
from app.models.project import create_project_schema
from app.middlewares.auth_middleware import Authenticator
from app.utils.role_enums import UserRole
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
        
    company_code = request.headers.get("x-company-code")
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
        project_data = create_project_schema(payload, created_by, company_code)
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
    
    
    



# def get project by id
def get_project_by_id(project_id):
   
    signature = request.headers.get("x-signature", "get_project_by_id_v1")
    company_id = request.headers.get("x-company-code")
    if not company_id:
        return jsonify(generate_response(
            signature,
            "get_project_by_id",
            "fail",
            error="Missing company ID in headers"
        )), 400

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(
            signature,
            "get_project_by_id",
            "fail",
            error="Invalid project ID format"
        )), 400

 
    project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    print(project,"project")
    if not project:
        return jsonify(generate_response(
            signature,
            "get_project_by_id",
            "fail",
            error="Project not found"
        )), 404

    
    if str(project["companyId"]) != str(company_id):
     return jsonify(generate_response(
        signature,
        "get_project_by_id",
        "fail",
        error="Access denied: this project does not belong to your company"
    )), 403


    return jsonify(generate_response(
        signature,
        "get_project_by_id",
        "success",
        {
            "project": {
                "id": str(project["_id"]),
                "name": project["name"],
                "description": project["description"],
                "companyId": str(project["companyId"]),
                "createdBy": project["createdBy"],
                "status": project["status"],
                "location": project["location"],
                "funding": project["funding"],
                "timeline": project["timeline"],
                "users": project["users"],
                "teamsize": project["teamsize"],
            }
        }
    )), 200




# add admins to a project

def add_admin_to_project():
    
    data = request.json
    signature = data.get("req",{}).get("signature", "add_admin_to_project")
    payload = data.get("payload",{})
    
    user_id = payload.get("userId")
    project_id = payload.get("projectId")
    companyCode = request.headers.get("x-company-code")
    if not user_id or not project_id or not companyCode:
        return jsonify(generate_response(signature, "fail", error="userId and projectId and companyCode are required")), 400
    
    if not ObjectId.is_valid(user_id) or not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature,"add_admin_to_project", "fail", errpr="Invalid Data format")),400
    
    role = request.user_role
    if role.lower() != "owner":
        return jsonify(generate_response(signature,"add_admin_to_project","fail",error="Only owners are allowed to add admins")),404
    
    project = mongo.db.projects.find_one({"_id":ObjectId(project_id), "companyCode":companyCode})
    if not project:
        return jsonify(generate_response(signature,"add_admin_to_project","fail",error="Project not found for the respective company")),404
    
    user = mongo.db.users.find_one({"_id":ObjectId(user_id),"companyCode":companyCode})
    if not user:
        return jsonify(generate_response(signature,"fail",error="No user found for this company")),404
    
    existing_roles = user.get("projectRoles", [])
    
    already_admin = any(str(role.get("projectId"))==project_id and role.get("role") == "Admin" for role in existing_roles )    
    
    if already_admin:
        return jsonify(generate_response(signature,"add_admin_to_project","fail",error="User is already assigned as the admin for this project")),400
    
    mongo.db.users.update_one(
        {"_id":ObjectId(user_id)},
        {
            "$set":{role:UserRole.ADMIN.value},
            "$push":{
                "projectRoles":{
                    "projectId":ObjectId(project_id),
                    "role":"Admin"
                }
            }
            
            }
    )
    
    updated_user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    
    response_data = {
        "id": str(updated_user["_id"]),
        "name": f"{updated_user.get('firstName', '')} {updated_user.get('lastName', '')}".strip(),
        "email": updated_user["email"],
        "role": updated_user["role"],
        "companyCode":updated_user["companyCode"],
        "projectRoles": [
            {
                "projectId": str(p["projectId"]),
                "role": p["role"]
            } for p in updated_user.get("projectRoles", [])
        ]
    }

    return jsonify(generate_response(signature, "add_admin_to_project", "success", {
        "admin": response_data
    })), 200