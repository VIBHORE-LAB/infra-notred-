from datetime import datetime
from bson import ObjectId

def create_progress_report_schema(data, project_id, uploaded_by, s3_urls):
    if not ObjectId.is_valid(project_id):
        raise ValueError("Invalid project ID format")
    
    return {
        "projectId": ObjectId(project_id),
        "uploadedBy": ObjectId(uploaded_by),
        "gpsCoordinates": {
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude")
        },
        "description": data.get("description", ""),
        "images": s3_urls,
        "timestamp": datetime.utcnow()
    }
