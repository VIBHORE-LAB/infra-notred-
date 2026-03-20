from flask import request, jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.response_util import generate_response
from app.models.site_condition import create_site_condition_schema, VALID_WEATHER_CONDITIONS, VALID_WORK_STATUSES


def log_site_condition():
    """POST /infrared/api/v1/site-conditions/ — log daily site condition"""
    signature = "log_site_condition"
    data = request.get_json(silent=True) or {}
    payload = data.get("payload", data)
    company_code = request.headers.get("x-company-code")

    project_id = payload.get("projectId")
    if not project_id or not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "log_site_condition", "fail", error="Valid projectId required")), 400

    project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "companyCode": company_code})
    if not project:
        return jsonify(generate_response(signature, "log_site_condition", "fail", error="Project not found")), 404

    if not payload.get("date"):
        return jsonify(generate_response(signature, "log_site_condition", "fail", error="date is required")), 400

    try:
        doc = create_site_condition_schema(payload, project_id, request.user_id)
        result = mongo.db.site_conditions.insert_one(doc)

        return jsonify(generate_response(signature, "log_site_condition", "success", {
            "conditionId": str(result.inserted_id),
            "date": doc.get("date"),
            "weather": doc.get("weather"),
            "workStatus": doc.get("workStatus"),
        })), 201
    except Exception as e:
        return jsonify(generate_response(signature, "log_site_condition", "fail", error=str(e))), 500


def get_site_conditions(project_id):
    """GET /infrared/api/v1/site-conditions/project/<project_id>?from=2026-01-01&to=2026-03-31"""
    signature = "get_site_conditions"

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "get_site_conditions", "fail", error="Invalid project ID")), 400

    date_from = request.args.get("from")
    date_to = request.args.get("to")

    query = {"projectId": ObjectId(project_id)}
    if date_from or date_to:
        date_filter = {}
        if date_from:
            date_filter["$gte"] = date_from
        if date_to:
            date_filter["$lte"] = date_to
        query["date"] = date_filter

    try:
        cursor = mongo.db.site_conditions.find(query).sort("date", -1)
        conditions = [_serialize_condition(c) for c in cursor]

        # Aggregated summary
        all_docs = list(mongo.db.site_conditions.find({"projectId": ObjectId(project_id)}))
        total_workers = sum(c.get("workersPresent", 0) for c in all_docs)
        total_incidents = sum(c.get("safetyIncidents", 0) for c in all_docs)
        halted_days = sum(1 for c in all_docs if c.get("workStatus") == "Halted")
        delayed_days = sum(1 for c in all_docs if c.get("workStatus") == "Delayed")

        weather_freq = {}
        for c in all_docs:
            w = c.get("weather", "")
            weather_freq[w] = weather_freq.get(w, 0) + 1

        return jsonify(generate_response(signature, "get_site_conditions", "success", {
            "projectId": project_id,
            "conditions": conditions,
            "total": len(conditions),
            "summary": {
                "totalDaysLogged": len(all_docs),
                "totalWorkersDeployed": total_workers,
                "totalSafetyIncidents": total_incidents,
                "haltedDays": halted_days,
                "delayedDays": delayed_days,
                "weatherFrequency": weather_freq,
            },
            "validWeather": VALID_WEATHER_CONDITIONS,
            "validWorkStatuses": VALID_WORK_STATUSES,
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_site_conditions", "fail", error=str(e))), 500


def _serialize_condition(c):
    return {
        "id": str(c["_id"]),
        "projectId": str(c.get("projectId")) if c.get("projectId") else None,
        "date": c.get("date"),
        "weather": c.get("weather"),
        "temperatureCelsius": c.get("temperatureCelsius"),
        "workersPresent": c.get("workersPresent", 0),
        "machinesOperational": c.get("machinesOperational", 0),
        "workStatus": c.get("workStatus", "Normal"),
        "delayReason": c.get("delayReason", ""),
        "safetyIncidents": c.get("safetyIncidents", 0),
        "notes": c.get("notes", ""),
        "loggedBy": str(c.get("loggedBy")) if c.get("loggedBy") else None,
        "createdAt": c["createdAt"].isoformat() + "Z" if c.get("createdAt") else None,
    }
