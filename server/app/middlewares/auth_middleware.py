from functools import wraps
from flask import request, jsonify
import jwt
import os
from app.utils.response_util import generate_response

JWT_SECRET = os.getenv("JWT_SECRET")

def Authenticator():
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            signature = "authenticator"

            auth_header = request.headers.get("Authorization", None)
            if not auth_header or not auth_header.startswith("Bearer "):
                return jsonify(generate_response(
                    signature,
                    "authenticator",
                    "fail",
                    error="Authorization header is missing or invalid"
                )), 401

            token = auth_header.split(" ")[1]

            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
                print("[DEBUG] JWT Payload:", payload)

                request.user_id = payload.get("user_id")
                request.user_role = payload.get("role", "").lower()
                print("[DEBUG] user_id:", request.user_id)
                print("[DEBUG] user_role (lowercased):", request.user_role)

                if not request.user_id or not request.user_role:
                    return jsonify(generate_response(
                        signature,
                        "authenticator",
                        "fail",
                        error="Invalid token payload: user_id or role missing"
                    )), 401

            except jwt.ExpiredSignatureError:
                return jsonify(generate_response(
                    signature,
                    "authenticator",
                    "fail",
                    error="Token has expired"
                )), 401
            except jwt.InvalidTokenError:
                return jsonify(generate_response(
                    signature,
                    "authenticator",
                    "fail",
                    error="Invalid token"
                )), 401

            return f(*args, **kwargs)
        return decorated_function
    return decorator
