from flask import request, jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.response_util import generate_response
from app.models.discussion import create_discussion_thread_schema, create_discussion_reply_schema


def create_thread(project_id):
    """POST /infrared/api/v1/discussions/project/<project_id>/thread"""
    signature = "create_thread"

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "create_thread", "fail", error="Invalid project ID")), 400

    project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "isActive": True})
    if not project:
        return jsonify(generate_response(signature, "create_thread", "fail", error="Project not found")), 404

    payload = request.get_json(silent=True) or {}
    title = (payload.get("title") or "").strip()
    body = (payload.get("body") or "").strip()

    if not title or not body:
        return jsonify(generate_response(signature, "create_thread", "fail", error="title and body are required")), 400

    try:
        doc = create_discussion_thread_schema(payload, project_id)
        result = mongo.db.discussions.insert_one(doc)

        return jsonify(generate_response(signature, "create_thread", "success", {
            "thread": {
                "id": str(result.inserted_id),
                "title": title,
                "authorName": doc.get("authorName"),
                "createdAt": doc["createdAt"].isoformat() + "Z",
            }
        })), 201
    except Exception as e:
        return jsonify(generate_response(signature, "create_thread", "fail", error=str(e))), 500


def get_threads(project_id):
    """GET /infrared/api/v1/discussions/project/<project_id>"""
    signature = "get_threads"

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "get_threads", "fail", error="Invalid project ID")), 400

    try:
        cursor = mongo.db.discussions.find(
            {"projectId": ObjectId(project_id), "isDeleted": False}
        ).sort("createdAt", -1)

        threads = [_serialize_thread(t) for t in cursor]

        return jsonify(generate_response(signature, "get_threads", "success", {
            "projectId": project_id,
            "threads": threads,
            "total": len(threads),
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_threads", "fail", error=str(e))), 500


def reply_to_thread(thread_id):
    """POST /infrared/api/v1/discussions/thread/<thread_id>/reply"""
    signature = "reply_to_thread"

    if not ObjectId.is_valid(thread_id):
        return jsonify(generate_response(signature, "reply_to_thread", "fail", error="Invalid thread ID")), 400

    payload = request.get_json(silent=True) or {}
    body = (payload.get("body") or "").strip()
    if not body:
        return jsonify(generate_response(signature, "reply_to_thread", "fail", error="body is required")), 400

    try:
        thread = mongo.db.discussions.find_one({"_id": ObjectId(thread_id), "isDeleted": False})
        if not thread:
            return jsonify(generate_response(signature, "reply_to_thread", "fail", error="Thread not found")), 404

        reply = create_discussion_reply_schema(payload)
        mongo.db.discussions.update_one(
            {"_id": ObjectId(thread_id)},
            {"$push": {"replies": reply}}
        )

        updated = mongo.db.discussions.find_one({"_id": ObjectId(thread_id)})
        return jsonify(generate_response(signature, "reply_to_thread", "success", {
            "thread": _serialize_thread(updated)
        })), 201
    except Exception as e:
        return jsonify(generate_response(signature, "reply_to_thread", "fail", error=str(e))), 500


def upvote_thread(thread_id):
    """POST /infrared/api/v1/discussions/thread/<thread_id>/upvote"""
    signature = "upvote_thread"

    if not ObjectId.is_valid(thread_id):
        return jsonify(generate_response(signature, "upvote_thread", "fail", error="Invalid thread ID")), 400

    payload = request.get_json(silent=True) or {}
    user_id = (payload.get("userId") or request.headers.get("x-public-user-id") or "").strip()
    if not user_id:
        return jsonify(generate_response(signature, "upvote_thread", "fail", error="userId is required")), 400

    try:
        thread = mongo.db.discussions.find_one({"_id": ObjectId(thread_id), "isDeleted": False})
        if not thread:
            return jsonify(generate_response(signature, "upvote_thread", "fail", error="Thread not found")), 404

        upvoters = thread.get("upvoterIds", [])
        if user_id in upvoters:
            # Toggle off
            upvoters.remove(user_id)
        else:
            upvoters.append(user_id)

        mongo.db.discussions.update_one(
            {"_id": ObjectId(thread_id)},
            {"$set": {"upvoterIds": upvoters, "upvoteCount": len(upvoters)}}
        )
        updated = mongo.db.discussions.find_one({"_id": ObjectId(thread_id)})
        return jsonify(generate_response(signature, "upvote_thread", "success", {
            "thread": _serialize_thread(updated)
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "upvote_thread", "fail", error=str(e))), 500


def upvote_reply(thread_id, reply_id):
    """POST /infrared/api/v1/discussions/thread/<thread_id>/reply/<reply_id>/upvote"""
    signature = "upvote_reply"

    if not ObjectId.is_valid(thread_id) or not ObjectId.is_valid(reply_id):
        return jsonify(generate_response(signature, "upvote_reply", "fail", error="Invalid ID")), 400

    payload = request.get_json(silent=True) or {}
    user_id = (payload.get("userId") or request.headers.get("x-public-user-id") or "").strip()
    if not user_id:
        return jsonify(generate_response(signature, "upvote_reply", "fail", error="userId is required")), 400

    try:
        thread = mongo.db.discussions.find_one({"_id": ObjectId(thread_id), "isDeleted": False})
        if not thread:
            return jsonify(generate_response(signature, "upvote_reply", "fail", error="Thread not found")), 404

        replies = thread.get("replies", [])
        for reply in replies:
            if str(reply.get("_id")) == reply_id:
                upvoters = reply.get("upvoterIds", [])
                if user_id in upvoters:
                    upvoters.remove(user_id)
                else:
                    upvoters.append(user_id)
                reply["upvoterIds"] = upvoters
                reply["upvoteCount"] = len(upvoters)
                break

        mongo.db.discussions.update_one(
            {"_id": ObjectId(thread_id)},
            {"$set": {"replies": replies}}
        )
        updated = mongo.db.discussions.find_one({"_id": ObjectId(thread_id)})
        return jsonify(generate_response(signature, "upvote_reply", "success", {
            "thread": _serialize_thread(updated)
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "upvote_reply", "fail", error=str(e))), 500


def _serialize_thread(t):
    replies = []
    for r in t.get("replies", []):
        replies.append({
            "id": str(r.get("_id")) if r.get("_id") else None,
            "body": r.get("body", ""),
            "authorName": r.get("authorName", "Anonymous"),
            "upvoteCount": r.get("upvoteCount", 0),
            "createdAt": r["createdAt"].isoformat() + "Z" if r.get("createdAt") else None,
        })
    return {
        "id": str(t["_id"]),
        "projectId": str(t.get("projectId")) if t.get("projectId") else None,
        "title": t.get("title", ""),
        "body": t.get("body", ""),
        "authorName": t.get("authorName", "Anonymous"),
        "upvoteCount": t.get("upvoteCount", 0),
        "replies": replies,
        "replyCount": len(replies),
        "createdAt": t["createdAt"].isoformat() + "Z" if t.get("createdAt") else None,
    }
