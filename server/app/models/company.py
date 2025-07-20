from datetime import datetime
from app.utils.domain_enums import CompanyDomain

def create_company_schema(data, owner_id, owner_name, company_code):
    if data.get("domain") not in CompanyDomain.list():
        raise ValueError("Invalid company domain")

    return {
        "name": data.get("name"),
        "ownerName": owner_name,
        "ownerId": owner_id,
        "code": company_code, 
        "address": data.get("address"),
        "domain": data.get("domain"), 
        "employeeCount": 1,
        "isActive": True,
        "createdAt": datetime.utcnow()
    }
