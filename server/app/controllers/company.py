from app.models.company import create_company_schema
from app.utils.domain_enums import CompanyDomain
from app.utils.response_util import generate_response
from app.extensions import mongo
from flask import request, jsonify
from app.utils.company_code_generator import generate_company_code
from bson import ObjectId

def create_company():
    
    data = request.json
    signature = data.get("req", {}).get("signature", "unknown_signature")
    payload = data.get("payload", {})
    
    role = request.user_role
    user_id = request.user_id

    if not role or role.lower() != "owner":

        return jsonify(generate_response(
            signature,
            "create_company",
            "fail",
            error = "unauthorized: only owner can create a company"
        )), 403

    owner_id = ObjectId(user_id)
    existing_company = mongo.db.companies.find_one({"ownerId": owner_id})
    if existing_company:
        return jsonify(generate_response(
            signature,
            "create_company",
            "fail",
            error = "Company already exists for this owner",
            
            
        )), 400
    
    company_name = payload.get("name")
    company_address = payload.get("address")
    company_domain = payload.get("domain", CompanyDomain.OTHER.value)
    
    if not company_name or not company_address or not company_domain:
        return jsonify(generate_response(
            signature,
            "create_company",
            "fail",
            error = "name,address, and domain are required fields"
        )),400
    
    while True:
        company_code = generate_company_code()
        if not mongo.db.companies.find_one({"code": company_code}):
            break
    
    owner_user = mongo.db.users.find_one({"_id": owner_id})
    if not owner_user:
        return jsonify (generate_response(
            signature,
            "create_company",
            "fail",
            error = "Owner user not found"
        )), 404

    try:
        owner_name = f"{owner_user.get('firstName', '')} {owner_user.get('lastName', '')}".strip()
        company = create_company_schema(payload, owner_id, owner_name, company_code)
    
    except ValueError as e:
        return jsonify(generate_response(
            signature,
            "create_company",
            "fail",
            error = str(e)
        )), 400
    
    result = mongo.db.companies.insert_one(company)
    
    mongo.db.users.update_one(
        {"_id": owner_id},
        {"$set": {"companyCode": company_code}}
    )
    
    return jsonify(generate_response(signature, "create_company", "success", {
        "company": {
            "id": str(result.inserted_id),
            "name": company["name"],
            "code": company_code,
            "address": company["address"],
            "domain": company["domain"],
            "owner Name": company["ownerName"],
        }
    })), 201
    


# here i am using company id instead of code and i have no clue why
def get_company_by_id(company_id):
    signature = request.args.get("signature", "unknown_signature")
    
    if not ObjectId.is_valid(company_id):
        return jsonify(generate_response(
            signature,
            "get_company_by_id",
            "fail",
            error="Invalid company ID format",
        )), 400
        
    company = mongo.db.companies.find_one({"_id": ObjectId(company_id)})
    if not company:
        return jsonify(generate_response(
            signature,
            "get_company_by_id",
            "fail",
            error = "Company not found"
            
        )), 404
        
    return jsonify(generate_response(
        signature,
        "get_company_by_id",
        "success",
        {
            "company": {
                "id": str(company["_id"]),
                "name": company["name"],
                "code": company["code"],
                "domain": company["domain"],
                "ownerId": str(company["ownerId"]),
                "ownerName": company["ownerName"],
                "address": company["address"],
                "employeeCount": company.get("employeeCount", 1),
                "isActive": company.get("isActive", True),
                "createdAt": company["createdAt"].isoformat() if company.get("createdAt") else None
            }
        }
    )), 200