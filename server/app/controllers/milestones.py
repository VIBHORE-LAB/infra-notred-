from flask import request, jsonify
from bson import ObjectId
from app.extensions import mongo
from app.models.milestone import create_milestone_schema
from app.utils.milestone_enums import Milestones
from app.utils.response_util import generate_response


def create_milestone():
    data = request.json
    payload = data.get("payload")
    project_id = payload.get("projectId")
    signature = data.get("signature")
    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature,"create_milestone","fail",error="Invalid project ID")), 400
    
    companyCode = request.headers.get('x-company-code')
    if not companyCode:
        return jsonify(generate_response(signature,"create_milestone","fail",error="Company code is required")), 400
    
    project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "companyCode": companyCode})
    if not project:
        return jsonify(generate_response(signature,"create_milestone","fail",error="Project not found")), 404
    
    created_by = request.user_id

    try:
        milestone_data = create_milestone_schema(
        data=payload,
        project_id=project_id,
        created_by=created_by,
        
        )
        mongo.db.milestones.insert_one(milestone_data)
        return jsonify(generate_response(signature,"create_milestone","success",data=milestone_data)), 201
    except Exception as e:
        return jsonify(generate_response(signature,"create_milestone","fail",error=str(e))), 500
