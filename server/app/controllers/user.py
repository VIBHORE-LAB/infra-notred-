from flask import request, jsonify
from app import mongo
from app.models.user import create_user_schema
from app.utils.jwt_util import generate_jwt_token
from app.utils.response_util import generate_response
from app.utils.role_enums import UserRole
import bcrypt # type: ignore

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
        company_id = None,
        role = UserRole.OWNER
    )
    result = mongo.db.users.insert_one(owner_data)
    
    
    token = generate_jwt_token(result.inserted_id, email)
    
    response = generate_response(signature, "register_owner", "success", {
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "firstName": owner_data["firstName"],
            "lastName": owner_data["lastName"],
            "email": owner_data["email"],
            "role": owner_data["role"],
            "companyId": None
        }
    })
    
    return jsonify(response), 201

