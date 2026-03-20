from datetime import datetime
from bson import ObjectId

VALID_FILE_TYPES = ["pdf", "docx", "xlsx", "png", "jpg", "jpeg", "dwg", "zip", "other"]


def create_document_schema(project_id, uploaded_by, file_name, file_url, file_type, file_size, tags=None):
    return {
        "projectId": ObjectId(project_id),
        "uploadedBy": ObjectId(uploaded_by) if ObjectId.is_valid(str(uploaded_by)) else uploaded_by,
        "fileName": file_name,
        "fileUrl": file_url,
        "fileType": file_type.lower() if file_type else "other",
        "fileSize": file_size,          # in bytes
        "tags": tags or [],
        "uploadedAt": datetime.utcnow(),
        "isDeleted": False,
    }
