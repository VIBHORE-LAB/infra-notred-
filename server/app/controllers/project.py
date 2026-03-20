from flask import request,jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.response_util import generate_response
from app.models.project import create_project_schema
from app.middlewares.auth_middleware import Authenticator
from app.utils.role_enums import UserRole

DEFAULT_PROJECT_TAGS = [
    "road",
    "bridge",
    "water",
    "power",
    "housing",
    "drainage",
    "rail",
    "inspection",
    "priority",
    "maintenance",
]

def get_all_projects():
    signature = "get_all_projects"
    company_code = request.headers.get("x-company-code")

    # Find by company code string OR by company ObjectId
    query = {}
    if company_code:
        query = {"$or": [
            {"companyCode": company_code},
            {"companyCode": ObjectId(company_code) if ObjectId.is_valid(company_code) else None}
        ]}

    try:
        cursor = mongo.db.projects.find(query).sort("createdAt", -1)
        projects = []
        for p in cursor:
            projects.append({
                "id": str(p["_id"]),
                "name": p.get("name", ""),
                "description": p.get("description", ""),
                "status": p.get("status", ""),
                "location": p.get("location", {}),
                "funding": p.get("funding", {}),
                "timeline": p.get("timeline", {}),
                "teamsize": p.get("teamsize", 0),
                "projectType": p.get("projectType", ""),
                "tags": p.get("tags", []),
            })
        return jsonify(generate_response(signature, "get_all_projects", "success", {"projects": projects})), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_all_projects", "fail", error=str(e))), 500


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
    
    companyCode = company["_id"]
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
                "companyCode": str(companyCode),
                "createdBy": created_by,
                "status": project_data["status"]
            }
        }
    )), 201      
    
    
    



# def get project by id
def get_project_by_id(project_id):
   
    signature = request.headers.get("x-signature", "get_project_by_id_v1")

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

    


    return jsonify(generate_response(
        signature,
        "get_project_by_id",
        "success",
        {
            "project": {
                "id": str(project["_id"]),
                "name": project["name"],
                "description": project["description"],
                "companyCode": str(project["companyCode"]),
                "createdBy": project["createdBy"],
                "status": project["status"],
                "location": project["location"],
                "funding": project["funding"],
                "timeline": project["timeline"],
                "users": project["users"],
                "teamsize": project["teamsize"],
                "projectType": project.get("projectType", ""),
                "tags": project.get("tags", []),
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


# ─────────────────────────────────────────────────────────────────────────────
# FEATURE 7: Project Tags & Smart Categorization
# ─────────────────────────────────────────────────────────────────────────────

def add_tags_to_project(project_id):
    """POST /infrared/api/v1/projects/<project_id>/tags"""
    signature = "add_tags_to_project"
    role = (request.user_role or "").lower()
    if role not in ["owner", "admin"]:
        return jsonify(generate_response(signature, "add_tags_to_project", "fail", error="Only owner/admin can add tags")), 403

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "add_tags_to_project", "fail", error="Invalid project ID")), 400

    company_code = request.headers.get("x-company-code")
    data = request.get_json(silent=True) or {}
    payload = data.get("payload", data)
    tags = payload.get("tags", [])

    if not tags or not isinstance(tags, list):
        return jsonify(generate_response(signature, "add_tags_to_project", "fail", error="tags must be a non-empty list")), 400

    tags = [str(t).strip().lower() for t in tags if str(t).strip()]

    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "companyCode": company_code})
        if not project:
            return jsonify(generate_response(signature, "add_tags_to_project", "fail", error="Project not found")), 404

        mongo.db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$addToSet": {"tags": {"$each": tags}}}
        )
        updated = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
        return jsonify(generate_response(signature, "add_tags_to_project", "success", {
            "projectId": project_id,
            "tags": updated.get("tags", []),
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "add_tags_to_project", "fail", error=str(e))), 500


def remove_tag_from_project(project_id):
    """DELETE /infrared/api/v1/projects/<project_id>/tags"""
    signature = "remove_tag_from_project"
    role = (request.user_role or "").lower()
    if role not in ["owner", "admin"]:
        return jsonify(generate_response(signature, "remove_tag_from_project", "fail", error="Unauthorized")), 403

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "remove_tag_from_project", "fail", error="Invalid project ID")), 400

    company_code = request.headers.get("x-company-code")
    data = request.get_json(silent=True) or {}
    tag = (data.get("tag") or "").strip().lower()

    if not tag:
        return jsonify(generate_response(signature, "remove_tag_from_project", "fail", error="tag is required")), 400

    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "companyCode": company_code})
        if not project:
            return jsonify(generate_response(signature, "remove_tag_from_project", "fail", error="Project not found")), 404

        mongo.db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$pull": {"tags": tag}}
        )
        updated = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
        return jsonify(generate_response(signature, "remove_tag_from_project", "success", {
            "projectId": project_id,
            "tags": updated.get("tags", []),
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "remove_tag_from_project", "fail", error=str(e))), 500


def get_projects_by_tag():
    """GET /infrared/api/v1/projects/by-tag?tag=road"""
    signature = "get_projects_by_tag"
    company_code = request.headers.get("x-company-code")
    tag = (request.args.get("tag") or "").strip().lower()

    if not tag:
        return jsonify(generate_response(signature, "get_projects_by_tag", "fail", error="tag query param is required")), 400

    try:
        cursor = mongo.db.projects.find(
            {"companyCode": company_code, "tags": tag, "isActive": True}
        ).sort("createdAt", -1)

        projects = []
        for p in cursor:
            projects.append({
                "id": str(p["_id"]),
                "name": p.get("name", ""),
                "status": p.get("status", ""),
                "tags": p.get("tags", []),
                "location": p.get("location", {}),
                "projectType": p.get("projectType", ""),
            })

        return jsonify(generate_response(signature, "get_projects_by_tag", "success", {
            "tag": tag,
            "projects": projects,
            "total": len(projects),
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_projects_by_tag", "fail", error=str(e))), 500


def get_available_project_tags():
    """GET /infrared/api/v1/projects/tags"""
    signature = "get_available_project_tags"
    company_code = request.headers.get("x-company-code")

    try:
        pipeline = [
            {"$match": {"companyCode": company_code}},
            {"$project": {"tags": {"$ifNull": ["$tags", []]}}},
            {"$unwind": {"path": "$tags", "preserveNullAndEmptyArrays": False}},
            {"$group": {"_id": None, "tags": {"$addToSet": "$tags"}}},
        ]
        result = list(mongo.db.projects.aggregate(pipeline))
        existing_tags = sorted([str(tag).strip().lower() for tag in (result[0].get("tags", []) if result else []) if str(tag).strip()])

        merged_tags = sorted(set(existing_tags + DEFAULT_PROJECT_TAGS))

        return jsonify(generate_response(signature, "get_available_project_tags", "success", {
            "tags": merged_tags,
            "existingTags": existing_tags,
            "defaultTags": DEFAULT_PROJECT_TAGS,
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_available_project_tags", "fail", error=str(e))), 500


def bulk_add_tags_to_projects():
    """POST /infrared/api/v1/projects/bulk-tags"""
    signature = "bulk_add_tags_to_projects"
    role = (request.user_role or "").lower()
    if role not in ["owner", "admin"]:
        return jsonify(generate_response(signature, "bulk_add_tags_to_projects", "fail", error="Only owner/admin can bulk update tags")), 403

    company_code = request.headers.get("x-company-code")
    data = request.get_json(silent=True) or {}
    payload = data.get("payload", data)

    project_ids = payload.get("projectIds", [])
    tags = payload.get("tags", [])

    if not project_ids or not isinstance(project_ids, list):
        return jsonify(generate_response(signature, "bulk_add_tags_to_projects", "fail", error="projectIds must be a non-empty list")), 400

    if not tags or not isinstance(tags, list):
        return jsonify(generate_response(signature, "bulk_add_tags_to_projects", "fail", error="tags must be a non-empty list")), 400

    invalid_ids = [pid for pid in project_ids if not ObjectId.is_valid(pid)]
    if invalid_ids:
        return jsonify(generate_response(signature, "bulk_add_tags_to_projects", "fail", error=f"Invalid project IDs: {invalid_ids}")), 400

    normalized_tags = sorted(set([str(tag).strip().lower() for tag in tags if str(tag).strip()]))
    if not normalized_tags:
        return jsonify(generate_response(signature, "bulk_add_tags_to_projects", "fail", error="No valid tags provided")), 400

    try:
        object_ids = [ObjectId(pid) for pid in project_ids]
        result = mongo.db.projects.update_many(
            {"_id": {"$in": object_ids}, "companyCode": company_code},
            {"$addToSet": {"tags": {"$each": normalized_tags}}},
        )

        updated_projects = list(mongo.db.projects.find(
            {"_id": {"$in": object_ids}, "companyCode": company_code},
            {"tags": 1}
        ))
        tags_by_project = {
            str(project["_id"]): project.get("tags", [])
            for project in updated_projects
        }

        return jsonify(generate_response(signature, "bulk_add_tags_to_projects", "success", {
            "requestedCount": len(project_ids),
            "matchedCount": result.matched_count,
            "updatedCount": result.modified_count,
            "tags": normalized_tags,
            "projects": tags_by_project,
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "bulk_add_tags_to_projects", "fail", error=str(e))), 500


# ─────────────────────────────────────────────────────────────────────────────
# FEATURE 13: Bulk Project Status Update
# ─────────────────────────────────────────────────────────────────────────────

VALID_PROJECT_STATUSES = ["Planned", "In Progress", "On Hold", "Completed", "Cancelled", "Under Review"]


def bulk_update_project_status():
    """POST /infrared/api/v1/projects/bulk-status"""
    signature = "bulk_update_project_status"
    role = (request.user_role or "").lower()
    if role not in ["owner", "admin"]:
        return jsonify(generate_response(signature, "bulk_update_project_status", "fail", error="Only owner/admin can bulk update")), 403

    company_code = request.headers.get("x-company-code")
    data = request.get_json(silent=True) or {}
    payload = data.get("payload", data)

    project_ids = payload.get("projectIds", [])
    new_status = (payload.get("status") or "").strip()

    if not project_ids or not isinstance(project_ids, list):
        return jsonify(generate_response(signature, "bulk_update_project_status", "fail", error="projectIds must be a non-empty list")), 400

    if new_status not in VALID_PROJECT_STATUSES:
        return jsonify(generate_response(signature, "bulk_update_project_status", "fail",
                                          error=f"Invalid status. Valid: {VALID_PROJECT_STATUSES}")), 400

    invalid_ids = [pid for pid in project_ids if not ObjectId.is_valid(pid)]
    if invalid_ids:
        return jsonify(generate_response(signature, "bulk_update_project_status", "fail",
                                          error=f"Invalid project IDs: {invalid_ids}")), 400

    try:
        object_ids = [ObjectId(pid) for pid in project_ids]
        result = mongo.db.projects.update_many(
            {"_id": {"$in": object_ids}, "companyCode": company_code},
            {"$set": {"status": new_status}}
        )

        return jsonify(generate_response(signature, "bulk_update_project_status", "success", {
            "newStatus": new_status,
            "requestedCount": len(project_ids),
            "updatedCount": result.modified_count,
            "matchedCount": result.matched_count,
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "bulk_update_project_status", "fail", error=str(e))), 500
