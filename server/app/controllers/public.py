from flask import jsonify, request
from bson import ObjectId
from datetime import datetime
from app.extensions import mongo
from app.utils.response_util import generate_response


def _serialize_project(doc, comment_count=0, upvote_count=0, downvote_count=0, user_vote=None):
    return {
        "id": str(doc.get("_id")),
        "name": doc.get("name", ""),
        "description": doc.get("description", ""),
        "status": doc.get("status", ""),
        "projectType": doc.get("projectType", ""),
        "location": doc.get("location", {}),
        "funding": doc.get("funding", {}),
        "timeline": doc.get("timeline", {}),
        "teamsize": doc.get("teamsize", 0),
        "commentCount": comment_count,
        "upvoteCount": upvote_count,
        "downvoteCount": downvote_count,
        "voteScore": upvote_count - downvote_count,
        "userVote": user_vote,
    }


def _serialize_comment(comment):
    created_at = comment.get("createdAt")
    return {
        "id": str(comment.get("_id")) if comment.get("_id") else None,
        "content": comment.get("content", ""),
        "authorName": comment.get("authorName", "Anonymous"),
        "createdAt": created_at.isoformat() + "Z" if created_at else None,
    }


def _serialize_forum(forum_doc, project_id, user_id=None):
    comments = forum_doc.get("comments", []) if forum_doc else []
    upvoter_ids = forum_doc.get("upvoterIds", []) if forum_doc else []
    downvoter_ids = forum_doc.get("downvoterIds", []) if forum_doc else []

    user_vote = None
    if user_id:
        if user_id in upvoter_ids:
            user_vote = "up"
        elif user_id in downvoter_ids:
            user_vote = "down"

    upvote_count = len(upvoter_ids)
    downvote_count = len(downvoter_ids)

    return {
        "projectId": project_id,
        "commentCount": len(comments),
        "comments": [_serialize_comment(comment) for comment in comments],
        "upvoteCount": upvote_count,
        "downvoteCount": downvote_count,
        "voteScore": upvote_count - downvote_count,
        "userVote": user_vote,
    }


def get_public_projects():
    signature = "get_public_projects"
    user_id = request.headers.get("x-public-user-id")

    try:
        projects_raw = list(mongo.db.projects.find({"isActive": True}).sort("createdAt", -1))
        project_ids = [project["_id"] for project in projects_raw]

        forum_map = {}
        if project_ids:
            forum_cursor = mongo.db.project_forums.aggregate([
                {"$match": {"projectId": {"$in": project_ids}}},
                {
                    "$project": {
                        "projectId": 1,
                        "commentCount": {"$size": {"$ifNull": ["$comments", []]}},
                        "upvoteCount": {"$size": {"$ifNull": ["$upvoterIds", []]}},
                        "downvoteCount": {"$size": {"$ifNull": ["$downvoterIds", []]}},
                        "upvoterIds": {"$ifNull": ["$upvoterIds", []]},
                        "downvoterIds": {"$ifNull": ["$downvoterIds", []]},
                    }
                },
            ])
            forum_map = {str(item.get("projectId")): item for item in forum_cursor}

        projects = []
        for project in projects_raw:
            pid = str(project["_id"])
            forum_data = forum_map.get(pid, {})
            upvoters = forum_data.get("upvoterIds", [])
            downvoters = forum_data.get("downvoterIds", [])
            user_vote = None
            if user_id:
                if user_id in upvoters:
                    user_vote = "up"
                elif user_id in downvoters:
                    user_vote = "down"

            projects.append(
                _serialize_project(
                    project,
                    forum_data.get("commentCount", 0),
                    forum_data.get("upvoteCount", 0),
                    forum_data.get("downvoteCount", 0),
                    user_vote,
                )
            )

        return jsonify(generate_response(signature, "get_public_projects", "success", {"projects": projects})), 200
    except Exception as error:
        return jsonify(generate_response(signature, "get_public_projects", "fail", error=str(error))), 500


def get_public_project_detail(project_id):
    signature = "get_public_project_detail"
    user_id = request.headers.get("x-public-user-id")

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "get_public_project_detail", "fail", error="invalid project id")), 400

    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "isActive": True})
        if not project:
            return jsonify(generate_response(signature, "get_public_project_detail", "fail", error="project not found")), 404

        forum = mongo.db.project_forums.find_one({"projectId": ObjectId(project_id)})
        forum_data = _serialize_forum(forum, project_id, user_id)

        return jsonify(
            generate_response(
                signature,
                "get_public_project_detail",
                "success",
                {
                    "project": _serialize_project(
                        project,
                        forum_data["commentCount"],
                        forum_data["upvoteCount"],
                        forum_data["downvoteCount"],
                        forum_data["userVote"],
                    ),
                    "forum": forum_data,
                },
            )
        ), 200
    except Exception as error:
        return jsonify(generate_response(signature, "get_public_project_detail", "fail", error=str(error))), 500


def add_project_comment(project_id):
    signature = "add_project_comment"
    payload = request.json or {}

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "add_project_comment", "fail", error="invalid project id")), 400

    content = (payload.get("content") or "").strip()
    if not content:
        return jsonify(generate_response(signature, "add_project_comment", "fail", error="content is required")), 400

    author_name = (payload.get("authorName") or "Anonymous Citizen").strip() or "Anonymous Citizen"
    comment = {
        "_id": ObjectId(),
        "content": content,
        "authorName": author_name,
        "createdAt": datetime.utcnow(),
    }

    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "isActive": True})
        if not project:
            return jsonify(generate_response(signature, "add_project_comment", "fail", error="project not found")), 404

        mongo.db.project_forums.update_one(
            {"projectId": ObjectId(project_id)},
            {
                "$setOnInsert": {"projectId": ObjectId(project_id), "upvoterIds": [], "downvoterIds": []},
                "$push": {"comments": comment},
            },
            upsert=True,
        )

        forum = mongo.db.project_forums.find_one({"projectId": ObjectId(project_id)})
        return jsonify(
            generate_response(
                signature,
                "add_project_comment",
                "success",
                {"forum": _serialize_forum(forum, project_id, request.headers.get("x-public-user-id"))},
            )
        ), 201
    except Exception as error:
        return jsonify(generate_response(signature, "add_project_comment", "fail", error=str(error))), 500


def vote_project_thread(project_id):
    signature = "vote_project_thread"
    payload = request.json or {}
    vote_type = (payload.get("voteType") or "").strip().lower()
    user_id = (payload.get("userId") or request.headers.get("x-public-user-id") or "").strip()

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "vote_project_thread", "fail", error="invalid project id")), 400
    if vote_type not in ["up", "down"]:
        return jsonify(generate_response(signature, "vote_project_thread", "fail", error="voteType must be 'up' or 'down'")), 400
    if not user_id:
        return jsonify(generate_response(signature, "vote_project_thread", "fail", error="userId is required")), 400

    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "isActive": True})
        if not project:
            return jsonify(generate_response(signature, "vote_project_thread", "fail", error="project not found")), 404

        mongo.db.project_forums.update_one(
            {"projectId": ObjectId(project_id)},
            {
                "$setOnInsert": {
                    "projectId": ObjectId(project_id),
                    "comments": [],
                    "upvoterIds": [],
                    "downvoterIds": [],
                }
            },
            upsert=True,
        )

        forum = mongo.db.project_forums.find_one({"projectId": ObjectId(project_id)}) or {}
        upvoter_ids = forum.get("upvoterIds", [])
        downvoter_ids = forum.get("downvoterIds", [])

        if vote_type == "up":
            if user_id not in upvoter_ids:
                upvoter_ids.append(user_id)
            if user_id in downvoter_ids:
                downvoter_ids.remove(user_id)
        else:
            if user_id not in downvoter_ids:
                downvoter_ids.append(user_id)
            if user_id in upvoter_ids:
                upvoter_ids.remove(user_id)

        mongo.db.project_forums.update_one(
            {"projectId": ObjectId(project_id)},
            {"$set": {"upvoterIds": upvoter_ids, "downvoterIds": downvoter_ids}},
        )

        updated = mongo.db.project_forums.find_one({"projectId": ObjectId(project_id)})
        return jsonify(
            generate_response(
                signature,
                "vote_project_thread",
                "success",
                {"forum": _serialize_forum(updated, project_id, user_id)},
            )
        ), 200
    except Exception as error:
        return jsonify(generate_response(signature, "vote_project_thread", "fail", error=str(error))), 500
