from flask import request, jsonify
from bson import ObjectId
from app.extensions import mongo
from app.models.funds import create_fund_transaction_schema
from app.utils.response_util import generate_response
from app.utils.funds_type_enums import FundType


def create_fund_transaction():
    data = request.json
    signature = data.get("signature", "unknown_signature")
    payload = data.get("payload", {})

    if not payload:
        return jsonify(generate_response(signature, "create_fund_transaction", "fail", error="All fields are mandatory")), 400

    companyCode = request.headers.get("x-company-code")
    if not companyCode:
        return jsonify(generate_response(signature, "create_fund_transaction", "fail", error="Company Code not found")), 400

    company = mongo.db.companies.find_one({"code": companyCode})
    if not company:
        return jsonify(generate_response(signature, "create_fund_transaction", "fail", error="Company not found")), 400

    role = request.user_role
    if role.lower() not in ["admin", "owner"]:
        return jsonify(generate_response(signature, "create_fund_transaction", "fail", error="Only admins and owners can create a transaction")), 403

    project_id = payload.get("projectId")
    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "create_fund_transaction", "fail", error="Invalid Project ID")), 400

    project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "companyCode": companyCode})
    if not project:
        return jsonify(generate_response(signature, "create_fund_transaction", "fail", error="No project found for this company")), 404

    fund_type = payload.get("type")
    if fund_type not in FundType.list():
        return jsonify(generate_response(signature, "create_fund_transaction", "fail", error=f"Invalid fund type. Valid types: {FundType.list()}")), 400

    user_id = request.user_id
    try:
        transaction = create_fund_transaction_schema(payload, project_id, user_id)
        mongo.db.fund_transaction.insert_one(transaction)
        pipeline =[
            {"$match":{"projectId": ObjectId(project_id)}},
            {""}
        ]
        return jsonify(generate_response(signature, "create_fund_transaction", "success", data={"transaction": "recorded"})), 201

    except Exception as e:
        return jsonify(generate_response(signature, "create_fund_transaction", "fail", error=str(e))), 500


def get_transaction_by_id(transaction_id):
    signature = request.args.get("signature", "get_transaction_by_id")

    if not ObjectId.is_valid(transaction_id):
        return jsonify(generate_response(
            signature,
            "get_transaction_by_id",
            "fail",
            error="Transaction id is not a valid format for an Id"
        )), 404

    try:
        transaction = mongo.db.fund_transaction.find_one({
            "_id": ObjectId(transaction_id),
        })

        if not transaction:
            return jsonify(generate_response(
                signature,
                "get_transaction_by_id",
                "fail",
                error="Transaction not found"
            )), 404

        transaction["_id"] = str(transaction["_id"])
        if "projectId" in transaction:
            transaction["projectId"] = str(transaction["projectId"])

        return jsonify(generate_response(
            signature,
            "get_transaction_by_id",
            "success",
            data=transaction 
        )), 200

    except Exception as e:
        return jsonify(generate_response(
            signature,
            "get_transaction_by_id",
            "fail",
            error="Internal server error",
            data=str(e)
        )), 500



def get_fund_summary_by_project(project_id):
    signature = request.args.get("signature", "get_fund_summary_by_project")
    
    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature,"get_fund_summary_by_project", "fail", error = "Invalid Project ID format")), 400
    
    project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        return jsonify(generate_response(signature,"get_fund_summary_by_project", "fail", error = "Project not found")), 404
    
    try:
        pipeline = [
            {"$match":{"projectId":ObjectId(project_id)}},
            {"$group":{
                "_id": "$type",
                "total": {"$sum": "$amount"}
            }}
        ]
        
        result = list(mongo.db.fund_transaction.aggregate(pipeline))
        summary = {"Credit":0, "Expenditure":0}
        for row in result:
            summary[row["_id"]] = row["total"]
        summary["utilization_percent"] = round((summary["Expenditure"] / summary["Credit"]) * 100, 2) if summary["Credit"] > 0 else 0
        return jsonify(generate_response(signature, "get_fund_summary_by_project", "success", data=summary)), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_fund_summary_by_project", "fail", error=str(e))), 500
        
def get_fund_transaction_by_project(project_id):
    signature = request.args.get("signature","get_fund_transaction_by_project")
    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature,"get_fund_transaction_by_project", "fail", error ="Invalid Project ID format")), 400
    
    project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        return jsonify(generate_response(signature,"get_fund_transaction_by_project", "fail", error = "Project not found")), 404
    
    
    
    