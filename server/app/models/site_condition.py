from datetime import datetime
from bson import ObjectId

VALID_WEATHER_CONDITIONS = ["Sunny", "Cloudy", "Rainy", "Stormy", "Foggy", "Windy", "Snowy", "Heatwave"]
VALID_WORK_STATUSES = ["Normal", "Delayed", "Halted", "On Hold"]


def create_site_condition_schema(data, project_id, logged_by):
    weather = data.get("weather", "Sunny")
    if weather not in VALID_WEATHER_CONDITIONS:
        weather = "Sunny"

    work_status = data.get("workStatus", "Normal")
    if work_status not in VALID_WORK_STATUSES:
        work_status = "Normal"

    return {
        "projectId": ObjectId(project_id),
        "loggedBy": ObjectId(logged_by) if ObjectId.is_valid(str(logged_by)) else logged_by,
        "date": data.get("date"),                # ISO date string from client
        "weather": weather,
        "temperatureCelsius": data.get("temperatureCelsius"),
        "workersPresent": data.get("workersPresent", 0),
        "machinesOperational": data.get("machinesOperational", 0),
        "workStatus": work_status,
        "delayReason": data.get("delayReason", ""),
        "safetyIncidents": data.get("safetyIncidents", 0),
        "notes": data.get("notes", "").strip(),
        "createdAt": datetime.utcnow(),
    }
