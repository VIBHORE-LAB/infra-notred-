from datetime import datetime
from app.utils.role_enums import UserRole

def create_user_schema(data, hashed_password, company_id=None, role=UserRole.USER):
    return {
        "firstName": data.get("firstName"),
        "lastName": data.get("lastName"),
        "email": data.get("email"),
        "password": hashed_password,
        "role": role.value,
        "companyId": company_id,
        "createdAt": datetime.utcnow()
    }
