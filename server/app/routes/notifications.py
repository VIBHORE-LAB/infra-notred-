from flask import Blueprint
from app.middlewares.auth_middleware import Authenticator
import app.controllers.notification_controller as nc

notifications_bp = Blueprint("notifications", __name__)

notifications_bp.route("/", methods=["GET"])(Authenticator()(nc.get_notifications))
notifications_bp.route("/<notif_id>/read", methods=["PUT"])(Authenticator()(nc.mark_notification_read))
notifications_bp.route("/read-all", methods=["PUT"])(Authenticator()(nc.mark_all_read))
notifications_bp.route("/<notif_id>", methods=["DELETE"])(Authenticator()(nc.delete_notification))
