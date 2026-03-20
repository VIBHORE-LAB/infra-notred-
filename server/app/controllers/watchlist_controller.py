from flask import request, jsonify
from bson import ObjectId
from datetime import datetime
from app.extensions import mongo
from app.utils.response_util import generate_response
from app.models.watchlist import create_watchlist_entry_schema


def toggle_watchlist(project_id):
    """POST /infrared/api/v1/public/projects/<project_id>/watch — add or remove from watchlist (toggle)"""
    signature = "toggle_watchlist"

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "toggle_watchlist", "fail", error="Invalid project ID")), 400

    payload = request.get_json(silent=True) or {}
    user_id = (payload.get("userId") or request.headers.get("x-public-user-id") or "").strip()

    if not user_id:
        return jsonify(generate_response(signature, "toggle_watchlist", "fail", error="userId is required")), 400

    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "isActive": True})
        if not project:
            return jsonify(generate_response(signature, "toggle_watchlist", "fail", error="Project not found")), 404

        existing = mongo.db.watchlist.find_one({"userId": user_id, "projectId": ObjectId(project_id)})

        if existing:
            # Already watching → remove
            mongo.db.watchlist.delete_one({"userId": user_id, "projectId": ObjectId(project_id)})
            watching = False
        else:
            # Not watching → add
            doc = create_watchlist_entry_schema(user_id, project_id)
            mongo.db.watchlist.insert_one(doc)
            watching = True

        total_watchers = mongo.db.watchlist.count_documents({"projectId": ObjectId(project_id)})

        return jsonify(generate_response(signature, "toggle_watchlist", "success", {
            "projectId": project_id,
            "userId": user_id,
            "watching": watching,
            "totalWatchers": total_watchers,
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "toggle_watchlist", "fail", error=str(e))), 500


def get_watchlist(user_id):
    """GET /infrared/api/v1/public/watchlist/<user_id> — get all saved/bookmarked projects for a user"""
    signature = "get_watchlist"

    try:
        entries = list(mongo.db.watchlist.find({"userId": user_id}).sort("savedAt", -1))
        project_ids = [e["projectId"] for e in entries]

        if not project_ids:
            return jsonify(generate_response(signature, "get_watchlist", "success", {
                "userId": user_id,
                "savedProjects": [],
                "total": 0,
            })), 200

        projects_raw = list(mongo.db.projects.find({"_id": {"$in": project_ids}, "isActive": True}))
        project_map = {str(p["_id"]): p for p in projects_raw}

        # Build in saved order
        saved_at_map = {str(e["projectId"]): e.get("savedAt") for e in entries}

        saved_projects = []
        for pid in [str(e["projectId"]) for e in entries]:
            p = project_map.get(pid)
            if not p:
                continue
            saved_projects.append({
                "id": str(p["_id"]),
                "name": p.get("name", ""),
                "description": p.get("description", ""),
                "status": p.get("status", ""),
                "projectType": p.get("projectType", ""),
                "location": p.get("location", {}),
                "funding": p.get("funding", {}),
                "savedAt": saved_at_map.get(pid, datetime.utcnow()).isoformat() + "Z",
            })

        return jsonify(generate_response(signature, "get_watchlist", "success", {
            "userId": user_id,
            "savedProjects": saved_projects,
            "total": len(saved_projects),
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_watchlist", "fail", error=str(e))), 500


def get_watcher_count(project_id):
    """GET /infrared/api/v1/public/projects/<project_id>/watchers — get watcher count + check if user is watching"""
    signature = "get_watcher_count"

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "get_watcher_count", "fail", error="Invalid project ID")), 400

    user_id = request.headers.get("x-public-user-id", "")

    try:
        total = mongo.db.watchlist.count_documents({"projectId": ObjectId(project_id)})
        is_watching = False
        if user_id:
            is_watching = mongo.db.watchlist.count_documents({
                "userId": user_id,
                "projectId": ObjectId(project_id)
            }) > 0

        return jsonify(generate_response(signature, "get_watcher_count", "success", {
            "projectId": project_id,
            "totalWatchers": total,
            "isWatching": is_watching,
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_watcher_count", "fail", error=str(e))), 500
