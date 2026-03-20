import cloudinary
import cloudinary.uploader
from flask import request, jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.response_util import generate_response
from app.models.document import create_document_schema
from app.utils.activity_logger import log_activity


def upload_document():
    """POST /infrared/api/v1/documents/upload — multipart upload (owner/admin)"""
    signature = "upload_document"
    role = (request.user_role or "").lower()
    if role not in ["owner", "admin"]:
        return jsonify(generate_response(signature, "upload_document", "fail", error="Only owner/admin can upload documents")), 403

    company_code = request.headers.get("x-company-code")
    project_id = request.form.get("projectId")
    tags_raw = request.form.get("tags", "")
    tags = [t.strip() for t in tags_raw.split(",") if t.strip()] if tags_raw else []

    if not project_id:
        return jsonify(generate_response(signature, "upload_document", "fail", error="projectId is required")), 400

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "upload_document", "fail", error="Invalid project ID")), 400

    project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "companyCode": company_code})
    if not project:
        return jsonify(generate_response(signature, "upload_document", "fail", error="Project not found")), 404

    file = request.files.get("document")
    if not file or file.filename == "":
        return jsonify(generate_response(signature, "upload_document", "fail", error="No document file provided")), 400

    try:
        file_bytes = file.read()
        file_size = len(file_bytes)

        upload_result = cloudinary.uploader.upload(
            file_bytes,
            folder=f"projects/{project_id}/documents",
            resource_type="auto",
            use_filename=True,
            unique_filename=True,
        )

        file_url = upload_result.get("secure_url", "")
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "other"

        doc = create_document_schema(
            project_id=project_id,
            uploaded_by=request.user_id,
            file_name=file.filename,
            file_url=file_url,
            file_type=ext,
            file_size=file_size,
            tags=tags,
        )
        result = mongo.db.documents.insert_one(doc)

        log_activity(
            request.user_id, _get_actor_name(), "added_document",
            company_code, project_id=project_id,
            meta={"fileName": file.filename, "docId": str(result.inserted_id)}
        )

        return jsonify(generate_response(signature, "upload_document", "success", {
            "document": {
                "id": str(result.inserted_id),
                "fileName": file.filename,
                "fileUrl": file_url,
                "fileType": ext,
                "fileSize": file_size,
                "tags": tags,
            }
        })), 201
    except Exception as e:
        return jsonify(generate_response(signature, "upload_document", "fail", error=str(e))), 500


def get_documents_by_project(project_id):
    """GET /infrared/api/v1/documents/project/<project_id>"""
    signature = "get_documents_by_project"

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "get_documents_by_project", "fail", error="Invalid project ID")), 400

    try:
        cursor = mongo.db.documents.find(
            {"projectId": ObjectId(project_id), "isDeleted": False}
        ).sort("uploadedAt", -1)

        docs = []
        for d in cursor:
            docs.append({
                "id": str(d["_id"]),
                "fileName": d.get("fileName", ""),
                "fileUrl": d.get("fileUrl", ""),
                "fileType": d.get("fileType", ""),
                "fileSize": d.get("fileSize", 0),
                "tags": d.get("tags", []),
                "uploadedBy": str(d.get("uploadedBy")) if d.get("uploadedBy") else None,
                "uploadedAt": d["uploadedAt"].isoformat() + "Z" if d.get("uploadedAt") else None,
            })

        return jsonify(generate_response(signature, "get_documents_by_project", "success", {
            "projectId": project_id,
            "documents": docs,
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_documents_by_project", "fail", error=str(e))), 500


def delete_document(doc_id):
    """DELETE /infrared/api/v1/documents/<doc_id> — soft delete (owner/admin)"""
    signature = "delete_document"
    role = (request.user_role or "").lower()
    if role not in ["owner", "admin"]:
        return jsonify(generate_response(signature, "delete_document", "fail", error="Unauthorized")), 403

    if not ObjectId.is_valid(doc_id):
        return jsonify(generate_response(signature, "delete_document", "fail", error="Invalid document ID")), 400

    try:
        result = mongo.db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {"isDeleted": True}}
        )
        if result.matched_count == 0:
            return jsonify(generate_response(signature, "delete_document", "fail", error="Document not found")), 404

        return jsonify(generate_response(signature, "delete_document", "success", {"deleted": doc_id})), 200
    except Exception as e:
        return jsonify(generate_response(signature, "delete_document", "fail", error=str(e))), 500


def _get_actor_name():
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(request.user_id)}, {"firstName": 1, "lastName": 1})
        if user:
            return f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
    except Exception:
        pass
    return "Unknown"
