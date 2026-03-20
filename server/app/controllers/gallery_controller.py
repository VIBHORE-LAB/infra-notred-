from flask import request, jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.response_util import generate_response


def get_public_photo_gallery(project_id):
    """GET /infrared/api/v1/public/projects/<project_id>/gallery — public progress report images"""
    signature = "get_public_photo_gallery"

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "get_public_photo_gallery", "fail", error="Invalid project ID")), 400

    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "isActive": True}, {"name": 1})
        if not project:
            return jsonify(generate_response(signature, "get_public_photo_gallery", "fail", error="Project not found")), 404

        page = max(1, int(request.args.get("page", 1)))
        limit = min(int(request.args.get("limit", 24)), 50)
        skip = (page - 1) * limit

        reports = list(
            mongo.db.progress_reports.find(
                {"projectId": ObjectId(project_id), "imageUrls": {"$exists": True, "$not": {"$size": 0}}}
            ).sort("timestamp", -1).skip(skip).limit(limit)
        )

        total_reports_with_images = mongo.db.progress_reports.count_documents(
            {"projectId": ObjectId(project_id), "imageUrls": {"$exists": True, "$not": {"$size": 0}}}
        )

        gallery = []
        for r in reports:
            for url in r.get("imageUrls", []):
                gallery.append({
                    "url": url,
                    "reportId": str(r["_id"]),
                    "description": r.get("description", ""),
                    "timestamp": r["timestamp"].isoformat() + "Z" if r.get("timestamp") else None,
                    "location": {
                        "latitude": r.get("latitude"),
                        "longitude": r.get("longitude"),
                    },
                })

        total_images = sum(len(r.get("imageUrls", [])) for r in
                           mongo.db.progress_reports.find({"projectId": ObjectId(project_id)},
                                                          {"imageUrls": 1}))

        return jsonify(generate_response(signature, "get_public_photo_gallery", "success", {
            "projectId": project_id,
            "projectName": project.get("name", ""),
            "gallery": gallery,
            "totalImages": total_images,
            "page": page,
            "limit": limit,
            "totalPages": -(-total_reports_with_images // limit) if total_reports_with_images else 1,
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_public_photo_gallery", "fail", error=str(e))), 500


def get_company_gallery():
    """GET /infrared/api/v1/public/gallery?companyCode=ABC&page=1 — all public photos for a company"""
    signature = "get_company_gallery"

    company_code = request.args.get("companyCode", "").strip()
    if not company_code:
        return jsonify(generate_response(signature, "get_company_gallery", "fail", error="companyCode query param is required")), 400

    page = max(1, int(request.args.get("page", 1)))
    limit = min(int(request.args.get("limit", 24)), 50)
    skip = (page - 1) * limit

    try:
        # Get all active project IDs for this company
        project_cursor = mongo.db.projects.find({"companyCode": company_code, "isActive": True}, {"_id": 1, "name": 1})
        project_map = {str(p["_id"]): p.get("name", "") for p in project_cursor}
        project_ids = [ObjectId(pid) for pid in project_map.keys()]

        if not project_ids:
            return jsonify(generate_response(signature, "get_company_gallery", "success", {
                "gallery": [], "total": 0
            })), 200

        total = mongo.db.progress_reports.count_documents({
            "projectId": {"$in": project_ids},
            "imageUrls": {"$exists": True, "$not": {"$size": 0}}
        })

        reports = list(mongo.db.progress_reports.find(
            {"projectId": {"$in": project_ids}, "imageUrls": {"$exists": True, "$not": {"$size": 0}}}
        ).sort("timestamp", -1).skip(skip).limit(limit))

        gallery = []
        for r in reports:
            pid = str(r.get("projectId", ""))
            for url in r.get("imageUrls", []):
                gallery.append({
                    "url": url,
                    "reportId": str(r["_id"]),
                    "projectId": pid,
                    "projectName": project_map.get(pid, ""),
                    "description": r.get("description", ""),
                    "timestamp": r["timestamp"].isoformat() + "Z" if r.get("timestamp") else None,
                })

        return jsonify(generate_response(signature, "get_company_gallery", "success", {
            "companyCode": company_code,
            "gallery": gallery,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": -(-total // limit) if total else 1,
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_company_gallery", "fail", error=str(e))), 500
