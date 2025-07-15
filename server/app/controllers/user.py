from flask import request, jsonify
from app.extensions import mongo
from app.models.user import create_user_schema
from app.utils.jwt_util import generate_jwt_token
from app.utils.response_util import generate_response
from app.utils.role_enums import UserRole
import bcrypt # type: ignore
from bson import ObjectId
# **only for owner**
def register_owner():
    data = request.json
    signature = data.get("req", {}).get("signature", "unknown_signature")
    payload = data.get("payload", {})   
    email = payload.get("email")
    password = payload.get("password")
    firstName = payload.get("firstName")
    lastName = payload.get("lastName")
    
    if not email or not password or not firstName or not lastName:
        return jsonify(generate_response(
            signature,
            "register_owner",
            "fail",
            error="Missing required fields: email or password or firstName or LastName"
        )),400
        
    existing_user = mongo.db.users.find_one({"email": email})
    if existing_user:
        return jsonify(generate_response(
            signature,
            "register_owner",
            "fail",
            error="User already exists with this email"
        )),400
        
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    owner_data = create_user_schema(
        payload,
        hashed_password,
        companyCode = None,
        role = UserRole.OWNER.value
    )
    result = mongo.db.users.insert_one(owner_data)
    
    
    token = generate_jwt_token(result.inserted_id, email, owner_data["role"])

    
    response = generate_response(signature, "register_owner", "success", {
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "firstName": owner_data["firstName"],
            "lastName": owner_data["lastName"],
            "email": owner_data["email"],
            "role": owner_data["role"],
            "companyCode": None
        }
    })
    
    return jsonify(response), 201


#register user(can be used for both admins and normal users)


def register_user():
    data = request.json
    signature = data.get("req", {}).get("signature", "unknown_signature")
    payload = data.get("payload", {})

    email = payload.get("email")
    password = payload.get("password")
    firstName = payload.get("firstName")
    lastName = payload.get("lastName")
    companyCode = payload.get("companyCode")

    if not email or not password or not firstName or not lastName or not companyCode:
        return jsonify(generate_response(signature, "register_user", "fail", error="All fields are required")), 400

    company = mongo.db.companies.find_one({"code": companyCode})
    if not company:
        return jsonify(generate_response(signature, "register_user", "fail", error="Invalid Company Code")), 400

    user = mongo.db.users.find_one({"email": email})
    if user:
        return jsonify(generate_response(signature, "register_user", "fail", error="User already exists")), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    user_data = create_user_schema(
        payload,
        hashed_password,
        companyCode=companyCode,
        role=UserRole.USER.value
    )

    result = mongo.db.users.insert_one(user_data)
    token = generate_jwt_token(result.inserted_id, email, user_data["role"])

    response = generate_response(signature, "register_user", "success", {
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "firstName": user_data["firstName"],
            "lastName": user_data["lastName"],
            "email": user_data["email"],
            "role": user_data["role"],
            "companyCode": user_data["companyCode"]
        }
    })

    return jsonify(response), 201














#**login**
def login_user():
    data = request.json
    signature = data.get("req", {}).get("signature", "unknown_signature")
    payload = data.get("payload", {})

    email = payload.get("email")
    passwordRaw = payload.get("password")

    if not email or not passwordRaw:
        return jsonify(generate_response(
            signature,
            "login_user",
            "fail",
            error="Email and Password are required"
        )), 400

    user = mongo.db.users.find_one({"email": email})
    if not user:
        return jsonify(generate_response(
            signature,
            "login_user",
            "fail",
            error="User not found with this email"
        )), 404

    if not bcrypt.checkpw(passwordRaw.encode("utf-8"), user["password"]):
        return jsonify(generate_response(
            signature,
            "login_user",
            "fail",
            error="Invalid password"
        )), 401

    token = generate_jwt_token(str(user["_id"]), user["email"], user["role"])


    return jsonify(generate_response(
        signature,
        "login_user",
        "success",
        {
            "token": token,
            "user": {
                "id": str(user["_id"]),
                "firstName": user["firstName"],
                "lastName": user["lastName"],
                "email": user["email"],
                "role": user["role"],
                "companyId": str(user["companyId"]) if user.get("companyId") else None
            }
        }
    )), 200








#get users by company
def get_users_by_company():
    data = request.json
    signature = data.get("req", {}).get("signature", "unknown_signature")
    company_code = request.headers.get("x-company-code")

    if not company_code:
        return jsonify(generate_response(signature, "get_users_by_company", "fail", error="Missing company code")), 400

    company = mongo.db.companies.find_one({"code": company_code})
    if not company:
        return jsonify(generate_response(signature, "get_users_by_company", "fail", error="Company not found")), 404


    users = list(mongo.db.users.find({"companyCode": company_code}, {
    "_id": 1,
    "firstName": 1,
    "lastName": 1,
    "email": 1,
    "role": 1
}))

    grouped = {
        "Owner": [],
        "Admin": [],
        "User": []
    }
    print("users", users)
    for user in users:
        role = user["role"]
        if role in grouped:
            grouped[role].append({
                "id": str(user["_id"]),
                "name": f"{user.get('firstName', '')} {user.get('lastName', '')}",
                "email": user["email"]
            })

    return jsonify(generate_response(signature, "get_users_by_company", "success", {
        "companyCode": company_code,
        "users": grouped
    })), 200


# get user by id

def get_user_by_id(user_id):
    signature =  "get user"
    if not ObjectId.is_valid(user_id):
        return jsonify(generate_response(signature,"get_user_by_id", "fail", error="Invalid user ID format")), 400
    
    
    role = request.user_role
    userId = request.user_id

    if not role or role.lower() != "owner" and role.lower() != "admin" and user_id != userId:
        return jsonify(generate_response(signature, "get_user_by_id", "fail", error="Unauthorized access")), 403

    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        return jsonify(generate_response(signature, "get_user_by_id", "fail", error="No user found")), 404

    return jsonify(generate_response(signature, "get_user_by_id", "success", {
        "user": {
            "id": str(user["_id"]),
            "firstName": user["firstName"],
            "lastName": user["lastName"],
            "email": user["email"],
            "role": user["role"],
            "companyId": str(user["companyId"]) if user.get("companyId") else None
        }
    })), 200
