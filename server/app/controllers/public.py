from flask import jsonify, request
from bson import ObjectId
from datetime import datetime
from app.extensions import mongo
from app.utils.response_util import generate_response
from app.models.rating import create_rating_schema, VALID_SENTIMENT_TAGS


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


# ─────────────────────────────────────────────────────────────────────────────
# FEATURE 3: Star Ratings & Citizen Sentiment
# ─────────────────────────────────────────────────────────────────────────────

def _build_project_ratings_summary(project_id):
    agg = list(mongo.db.project_ratings.aggregate([
        {"$match": {"projectId": ObjectId(project_id)}},
        {"$group": {
            "_id": "$stars",
            "count": {"$sum": 1}
        }}
    ]))

    distribution = {str(i): 0 for i in range(1, 6)}
    total = 0
    weighted_sum = 0
    for item in agg:
        star_value = int(item["_id"])
        count = int(item["count"])
        distribution[str(star_value)] = count
        total += count
        weighted_sum += star_value * count

    avg = round(weighted_sum / total, 2) if total > 0 else 0.0

    sentiment_agg = list(mongo.db.project_ratings.aggregate([
        {"$match": {"projectId": ObjectId(project_id), "sentimentTag": {"$ne": None}}},
        {"$group": {"_id": "$sentimentTag", "count": {"$sum": 1}}}
    ]))
    sentiment_breakdown = {str(item["_id"]): int(item["count"]) for item in sentiment_agg if item.get("_id")}

    return {
        "projectId": project_id,
        "averageRating": avg,
        "totalRatings": total,
        "distribution": distribution,
        "sentimentBreakdown": sentiment_breakdown,
        "validSentimentTags": VALID_SENTIMENT_TAGS,
    }

def rate_project(project_id):
    """POST /infrared/api/v1/public/projects/<project_id>/rate"""
    signature = "rate_project"
    payload = request.get_json(silent=True) or {}

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "rate_project", "fail", error="Invalid project ID")), 400

    user_id = (payload.get("userId") or request.headers.get("x-public-user-id") or "").strip()
    if not user_id:
        return jsonify(generate_response(signature, "rate_project", "fail", error="userId is required")), 400

    stars = payload.get("stars")
    if not stars or not isinstance(stars, int) or not (1 <= stars <= 5):
        return jsonify(generate_response(signature, "rate_project", "fail", error="stars must be an integer 1-5")), 400

    sentiment_tag = payload.get("sentimentTag")

    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id), "isActive": True})
        if not project:
            return jsonify(generate_response(signature, "rate_project", "fail", error="Project not found")), 404

        rating_doc = create_rating_schema(project_id, user_id, stars, sentiment_tag)

        # Upsert: one rating per user per project
        mongo.db.project_ratings.update_one(
            {"projectId": ObjectId(project_id), "userId": user_id},
            {"$set": rating_doc},
            upsert=True,
        )

        summary = _build_project_ratings_summary(project_id)
        summary["yourRating"] = stars

        return jsonify(generate_response(signature, "rate_project", "success", summary)), 200
    except Exception as error:
        return jsonify(generate_response(signature, "rate_project", "fail", error=str(error))), 500


def get_project_ratings(project_id):
    """GET /infrared/api/v1/public/projects/<project_id>/ratings"""
    signature = "get_project_ratings"

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "get_project_ratings", "fail", error="Invalid project ID")), 400

    try:
        return jsonify(generate_response(signature, "get_project_ratings", "success", _build_project_ratings_summary(project_id))), 200
    except Exception as error:
        return jsonify(generate_response(signature, "get_project_ratings", "fail", error=str(error))), 500


# ─────────────────────────────────────────────────────────────────────────────
# FEATURE 5: Advanced Public Search & Filters
# ─────────────────────────────────────────────────────────────────────────────

def search_public_projects():
    """GET /infrared/api/v1/public/projects/search?q=road&city=Delhi&status=Active..."""
    signature = "search_public_projects"

    q = request.args.get("q", "").strip()
    city = request.args.get("city", "").strip()
    status = request.args.get("status", "").strip()
    project_type = request.args.get("projectType", "").strip()
    min_budget = request.args.get("minBudget")
    max_budget = request.args.get("maxBudget")
    sort_by = request.args.get("sortBy", "date").strip()  # date | budget | votes
    page = max(1, int(request.args.get("page", 1)))
    limit = min(int(request.args.get("limit", 20)), 50)
    skip = (page - 1) * limit
    user_id = request.headers.get("x-public-user-id", "")

    query = {"isActive": True}

    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
        ]
    if city:
        query["location.city"] = {"$regex": city, "$options": "i"}
    if status:
        query["status"] = status
    if project_type:
        query["projectType"] = project_type
    if min_budget or max_budget:
        budget_filter = {}
        if min_budget:
            budget_filter["$gte"] = float(min_budget)
        if max_budget:
            budget_filter["$lte"] = float(max_budget)
        query["funding.estimatedBudget"] = budget_filter

    try:
        total = mongo.db.projects.count_documents(query)

        # Sort
        sort_map = {
            "budget": [("funding.estimatedBudget", -1)],
            "date": [("createdAt", -1)],
        }
        mongo_sort = sort_map.get(sort_by, [("createdAt", -1)])

        projects_raw = list(mongo.db.projects.find(query).sort(mongo_sort).skip(skip).limit(limit))
        project_ids = [p["_id"] for p in projects_raw]

        # Forum data
        forum_map = {}
        if project_ids:
            for item in mongo.db.project_forums.aggregate([
                {"$match": {"projectId": {"$in": project_ids}}},
                {"$project": {
                    "projectId": 1,
                    "commentCount": {"$size": {"$ifNull": ["$comments", []]}},
                    "upvoteCount": {"$size": {"$ifNull": ["$upvoterIds", []]}},
                    "downvoteCount": {"$size": {"$ifNull": ["$downvoterIds", []]}},
                    "upvoterIds": {"$ifNull": ["$upvoterIds", []]},
                    "downvoterIds": {"$ifNull": ["$downvoterIds", []]},
                }}
            ]):
                forum_map[str(item["projectId"])] = item

        # Rating data
        rating_map = {}
        if project_ids:
            for item in mongo.db.project_ratings.aggregate([
                {"$match": {"projectId": {"$in": project_ids}}},
                {"$group": {"_id": "$projectId", "avgStars": {"$avg": "$stars"}, "total": {"$sum": 1}}}
            ]):
                rating_map[str(item["_id"])] = {"avgStars": round(item["avgStars"], 2), "total": item["total"]}

        results = []
        for p in projects_raw:
            pid = str(p["_id"])
            fd = forum_map.get(pid, {})
            rd = rating_map.get(pid, {})

            upvoters = fd.get("upvoterIds", [])
            downvoters = fd.get("downvoterIds", [])
            user_vote = None
            if user_id:
                if user_id in upvoters:
                    user_vote = "up"
                elif user_id in downvoters:
                    user_vote = "down"

            serialized = _serialize_project(
                p,
                fd.get("commentCount", 0),
                fd.get("upvoteCount", 0),
                fd.get("downvoteCount", 0),
                user_vote,
            )
            serialized["averageRating"] = rd.get("avgStars", 0)
            serialized["totalRatings"] = rd.get("total", 0)
            results.append(serialized)

        # If sort_by is votes, sort client-side after enrichment
        if sort_by == "votes":
            results.sort(key=lambda x: x.get("voteScore", 0), reverse=True)

        return jsonify(generate_response(signature, "search_public_projects", "success", {
            "projects": results,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": -(-total // limit),
            "query": {"q": q, "city": city, "status": status, "projectType": project_type, "sortBy": sort_by},
        })), 200
    except Exception as error:
        return jsonify(generate_response(signature, "search_public_projects", "fail", error=str(error))), 500


# ─────────────────────────────────────────────────────────────────────────────
# FEATURE 10: GIS Budget Heatmap
# ─────────────────────────────────────────────────────────────────────────────

def get_budget_heatmap():
    """GET /infrared/api/v1/public/heatmap — geo-tagged budget pressure data"""
    signature = "get_budget_heatmap"

    try:
        cursor = mongo.db.projects.find(
            {"isActive": True},
            {
                "name": 1, "status": 1, "projectType": 1,
                "location": 1, "funding": 1, "timeline": 1,
            }
        )

        points = []
        for p in cursor:
            lat = p.get("location", {}).get("latitude")
            lng = p.get("location", {}).get("longitude")
            # Some projects might not have lat/lng — skip
            if lat is None or lng is None:
                continue

            funding = p.get("funding", {})
            estimated = funding.get("estimatedBudget", 0) or 0
            spent = funding.get("totalSpent", 0) or 0
            pressure = round((spent / estimated * 100), 1) if estimated > 0 else 0

            points.append({
                "id": str(p["_id"]),
                "name": p.get("name", ""),
                "status": p.get("status", ""),
                "projectType": p.get("projectType", ""),
                "latitude": lat,
                "longitude": lng,
                "estimatedBudget": estimated,
                "totalSpent": spent,
                "budgetPressure": pressure,   # 0-100+ %
                "city": p.get("location", {}).get("city", ""),
            })

        return jsonify(generate_response(signature, "get_budget_heatmap", "success", {
            "heatmapPoints": points,
            "total": len(points),
        })), 200
    except Exception as error:
        return jsonify(generate_response(signature, "get_budget_heatmap", "fail", error=str(error))), 500
