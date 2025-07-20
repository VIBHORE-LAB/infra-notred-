import jwt  # type: ignore
import datetime
import os

JWT_SECRET = os.getenv("JWT_SECRET")

def generate_jwt_token(user_id, email, role): 
    payload = {
        "user_id": str(user_id),
        "email": email,
        "role": role,  
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def decode_jwt_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
