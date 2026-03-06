import cloudinary
import cloudinary.uploader
from flask import request, jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.response_util import generate_response
from app.models.progress_report import create_progress_report_schema

def create_report():
    signature = "create_report"
    
    # We expect multipart/form-data
    projectId = request.form.get("projectId")
    latitude = request.form.get("latitude")
    longitude = request.form.get("longitude")
    description = request.form.get("description", "")
    
    if not projectId or not latitude or not longitude:
        return jsonify(generate_response(
            signature, "create_report", "fail", error="projectId, latitude, and longitude are required"
        )), 400

    companyCode = request.headers.get("x-company-code")
    if not companyCode:
         return jsonify(generate_response(
            signature, "create_report", "fail", error="Company code is missing"
        )), 400

    # Validate project
    project = mongo.db.projects.find_one({"_id": ObjectId(projectId), "companyCode": companyCode})
    if not project:
         return jsonify(generate_response(
            signature, "create_report", "fail", error="Project not found"
        )), 404

    files = request.files.getlist("images")
    image_urls = []

    # Upload files to Cloudinary
    for file in files:
        if file.filename != '':
            upload_result = cloudinary.uploader.upload(
                file.read(),
                folder=f"projects/{projectId}/reports"
            )
            url = upload_result.get("secure_url")
            if url:
                image_urls.append(url)

    data = {
        "latitude": float(latitude),
        "longitude": float(longitude),
        "description": description
    }
    
    try:
        report_doc = create_progress_report_schema(data, projectId, request.user_id, image_urls)
        result = mongo.db.progress_reports.insert_one(report_doc)
        
        return jsonify(generate_response(
            signature, "create_report", "success", data={"reportId": str(result.inserted_id)}
        )), 201
    except Exception as e:
        return jsonify(generate_response(
            signature, "create_report", "fail", error=str(e)
        )), 500

def get_reports_by_project(project_id):
    signature = "get_reports_by_project"
    
    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(
            signature, "get_reports_by_project", "fail", error="Invalid Project ID format"
        )), 400

    try:
        reports_cursor = mongo.db.progress_reports.find({"projectId": ObjectId(project_id)}).sort("timestamp", -1)
        reports = []
        for r in reports_cursor:
            r["_id"] = str(r["_id"])
            r["projectId"] = str(r["projectId"])
            r["uploadedBy"] = str(r["uploadedBy"])
            r["timestamp"] = r["timestamp"].isoformat() if "timestamp" in r else None
            reports.append(r)
            
        return jsonify(generate_response(
            signature, "get_reports_by_project", "success", data={"reports": reports}
        )), 200
    except Exception as e:
        return jsonify(generate_response(
            signature, "get_reports_by_project", "fail", error=str(e)
        )), 500

def get_all_company_reports():
    signature = "get_all_company_reports"
    company_code = request.headers.get("x-company-code")
    
    if not company_code:
        return jsonify(generate_response(signature, "get_all_company_reports", "fail", error="Company code required")), 400

    try:
        # 1. Get all projects for this company
        project_cursor = mongo.db.projects.find({"companyCode": company_code}, {"_id": 1, "name": 1, "description": 1})
        projects_map = {str(p["_id"]): {"name": p.get("name"), "description": p.get("description")} for p in project_cursor}
        project_ids = [ObjectId(pid) for pid in projects_map.keys()]
        
        if not project_ids:
            return jsonify(generate_response(signature, "get_all_company_reports", "success", data={"reports": []})), 200

        # 2. Get all reports for these projects
        reports_cursor = mongo.db.progress_reports.find({"projectId": {"$in": project_ids}}).sort("timestamp", -1)
        reports = []
        for r in reports_cursor:
            r["_id"] = str(r["_id"])
            pid_str = str(r["projectId"])
            r["projectId"] = pid_str
            r["uploadedBy"] = str(r["uploadedBy"])
            r["timestamp"] = r["timestamp"].isoformat() if "timestamp" in r else None
            
            # Inject project info for GIS hover
            if pid_str in projects_map:
                r["projectName"] = projects_map[pid_str]["name"]
                r["projectDescription"] = projects_map[pid_str]["description"]
                
            reports.append(r)
            
        return jsonify(generate_response(signature, "get_all_company_reports", "success", data={"reports": reports})), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_all_company_reports", "fail", error=str(e))), 500
