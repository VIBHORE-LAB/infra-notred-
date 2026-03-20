from flask import request, jsonify
from bson import ObjectId
from datetime import datetime
from app.extensions import mongo
from app.utils.response_util import generate_response


def get_notifications():
    """GET /infrared/api/v1/notifications/ — fetch all notifications for the auth user"""
    signature = "get_notifications"
    user_id = request.user_id

    try:
        cursor = mongo.db.notifications.find(
            {"userId": ObjectId(user_id)}
        ).sort("createdAt", -1).limit(100)

        notifications = []
        unread_count = 0
        for n in cursor:
            is_read = n.get("isRead", False)
            if not is_read:
                unread_count += 1
            notifications.append({
                "id": str(n["_id"]),
                "type": n.get("type"),
                "message": n.get("message"),
                "projectId": str(n["projectId"]) if n.get("projectId") else None,
                "meta": n.get("meta", {}),
                "isRead": is_read,
                "createdAt": n["createdAt"].isoformat() + "Z" if n.get("createdAt") else None,
            })

        return jsonify(generate_response(signature, "get_notifications", "success", {
            "notifications": notifications,
            "unreadCount": unread_count,
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_notifications", "fail", error=str(e))), 500


def mark_notification_read(notif_id):
    """PUT /infrared/api/v1/notifications/<id>/read — mark single notification as read"""
    signature = "mark_notification_read"
    user_id = request.user_id

    if not ObjectId.is_valid(notif_id):
        return jsonify(generate_response(signature, "mark_notification_read", "fail", error="Invalid notification ID")), 400

    try:
        result = mongo.db.notifications.update_one(
            {"_id": ObjectId(notif_id), "userId": ObjectId(user_id)},
            {"$set": {"isRead": True}}
        )
        if result.matched_count == 0:
            return jsonify(generate_response(signature, "mark_notification_read", "fail", error="Notification not found")), 404

        return jsonify(generate_response(signature, "mark_notification_read", "success", {"notifId": notif_id})), 200
    except Exception as e:
        return jsonify(generate_response(signature, "mark_notification_read", "fail", error=str(e))), 500


def mark_all_read():
    """PUT /infrared/api/v1/notifications/read-all — mark all notifications as read"""
    signature = "mark_all_read"
    user_id = request.user_id

    try:
        mongo.db.notifications.update_many(
            {"userId": ObjectId(user_id), "isRead": False},
            {"$set": {"isRead": True}}
        )
        return jsonify(generate_response(signature, "mark_all_read", "success", {"message": "All notifications marked as read"})), 200
    except Exception as e:
        return jsonify(generate_response(signature, "mark_all_read", "fail", error=str(e))), 500


def delete_notification(notif_id):
    """DELETE /infrared/api/v1/notifications/<id> — delete a notification"""
    signature = "delete_notification"
    user_id = request.user_id

    if not ObjectId.is_valid(notif_id):
        return jsonify(generate_response(signature, "delete_notification", "fail", error="Invalid notification ID")), 400

    try:
        result = mongo.db.notifications.delete_one(
            {"_id": ObjectId(notif_id), "userId": ObjectId(user_id)}
        )
        if result.deleted_count == 0:
            return jsonify(generate_response(signature, "delete_notification", "fail", error="Notification not found")), 404

        return jsonify(generate_response(signature, "delete_notification", "success", {"deleted": notif_id})), 200
    except Exception as e:
        return jsonify(generate_response(signature, "delete_notification", "fail", error=str(e))), 500
