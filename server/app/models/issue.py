from datetime import datetime
from bson import ObjectId

VALID_SEVERITIES = ["Low", "Medium", "High", "Critical"]
VALID_ISSUE_STATUSES = ["Open", "In Progress", "Resolved", "Closed", "Wont Fix"]
VALID_ISSUE_TYPES = ["Defect", "Safety", "Design", "Environmental", "Structural", "Electrical", "Plumbing", "Other"]


def create_issue_schema(data, project_id, reported_by):
    severity = data.get("severity", "Medium")
    if severity not in VALID_SEVERITIES:
        severity = "Medium"

    issue_type = data.get("issueType", "Other")
    if issue_type not in VALID_ISSUE_TYPES:
        issue_type = "Other"

    return {
        "projectId": ObjectId(project_id),
        "title": data.get("title", "").strip(),
        "description": data.get("description", "").strip(),
        "severity": severity,
        "issueType": issue_type,
        "status": "Open",
        "reportedBy": ObjectId(reported_by) if ObjectId.is_valid(str(reported_by)) else reported_by,
        "assignedTo": None,
        "imageUrls": data.get("imageUrls", []),
        "location": data.get("location", ""),       # text description of where on site
        "resolutionNote": None,
        "resolvedAt": None,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "isDeleted": False,
    }
