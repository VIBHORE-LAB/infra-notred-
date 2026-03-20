from datetime import datetime
from bson import ObjectId

VALID_SIGNOFF_TYPES = [
    "Phase Completion",
    "Milestone Approval",
    "Inspection Passed",
    "Final Completion",
    "Budget Approval",
    "Quality Clearance",
]


def create_signoff_schema(data, project_id, signed_by):
    signoff_type = data.get("signoffType", "Phase Completion")
    if signoff_type not in VALID_SIGNOFF_TYPES:
        signoff_type = "Phase Completion"

    return {
        "projectId": ObjectId(project_id),
        "signoffType": signoff_type,
        "title": data.get("title", "").strip(),
        "remarks": data.get("remarks", "").strip(),
        "signedBy": ObjectId(signed_by) if ObjectId.is_valid(str(signed_by)) else signed_by,
        "signedAt": datetime.utcnow(),
        "attachmentUrl": data.get("attachmentUrl"),   # optional certificate PDF URL
        "isPublic": data.get("isPublic", False),       # can be shown publicly
        "createdAt": datetime.utcnow(),
    }
