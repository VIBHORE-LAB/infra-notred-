from datetime import datetime
from bson import ObjectId
from app.utils.funds_type_enums import FundType

def create_fund_transaction_schema(data, project_id, created_by):
    if not ObjectId.is_valid(project_id):
        raise ValueError("Invalid Project ID format")

    txn_type = data.get("type")
    if txn_type not in FundType.list():
        raise ValueError("Invalid transaction type")

    return {
        "projectId": ObjectId(project_id),
        "type": txn_type, 
        "amount": float(data.get("amount")),
        "purpose": data.get("purpose"),
        "date": datetime.utcnow(),
        "createdBy": ObjectId(created_by)
    }
