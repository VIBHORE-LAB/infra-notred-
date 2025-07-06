from datetime import datetime
from bson import ObjectId

def create_project_schema(data,created_by, company_id):
    if not ObjectId.is_valid(company_id):
        raise ValueError("Invalid company ID")
    
    
    return {
        "name": data.get("name"),
        "description": data.get("description"),
        "companyId": company_id,
        "createdBy": created_by,
        "funding": {
            "estimatedBudget": data.get("estimatedBudget"),
            "fundingSource": data.get("fundingSource")
        },
        "timeline": {
            "startDate": data.get("startDate"),
            "endDate": data.get("endDate"),
            "deadline": data.get("deadline")
        },
        "status": data.get("status","Planned"),
        "projectType": data.get("projectType"),
        "location": {
            "city": data.get("city"),
            "state": data.get("state"),
            "country": data.get("country"),
            "zipCode": data.get("zipCode"),
            "areaInSqFt": data.get("areaInSqFt")
        },
        "teamsize": data.get("teamsize"),
        "isActive": True,
        "createdAt": datetime.utcnow(),
        "users": {
            "admins": [],
            "users": []
        }
    }

