from flask import Blueprint
from app.middlewares.auth_middleware import Authenticator
import app.controllers.announcement_controller as ann

announcements_bp = Blueprint("announcements", __name__)

# Private: create and delete
announcements_bp.route("/", methods=["POST"])(Authenticator()(ann.create_announcement))
announcements_bp.route("/<ann_id>", methods=["DELETE"])(Authenticator()(ann.delete_announcement))

# Public: read announcements by project — no auth needed
announcements_bp.route("/project/<project_id>", methods=["GET"])(ann.get_announcements_by_project)
