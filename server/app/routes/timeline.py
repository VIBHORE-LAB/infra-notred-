from flask import Blueprint
from app.middlewares.auth_middleware import Authenticator
import app.controllers.timeline_controller as tc

timeline_bp = Blueprint("timeline", __name__)

timeline_bp.route("/", methods=["POST"])(Authenticator()(tc.create_event))
timeline_bp.route("/project/<project_id>", methods=["GET"])(Authenticator()(tc.get_events_by_project))
timeline_bp.route("/<event_id>", methods=["DELETE"])(Authenticator()(tc.delete_event))
