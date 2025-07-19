from datetime import datetime
from bson import ObjectId

def create_project_schema(data,created_by, company_code):

    
    
    return {
        "name": data.get("name"),
        "description": data.get("description"),
        "companyCode": company_code,
        "createdBy": created_by,
        "funding": {
            "estimatedBudget": data.get("estimatedBudget"),
            "fundingSource": data.get("fundingSource"),
            "totalAllocated": 0,
            "totalSpent": 0,
            "utilizationPercent": 0

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

