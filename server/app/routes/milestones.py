from flask import Blueprint
from app.controllers.project_updater import create_project_update, get_project_update
from app.middlewares.auth_middleware import Authenticator
from app.controllers.milestones import create_milestone, get_milestones_by_project

milestones_bp = Blueprint('milestones', __name__)

milestones_bp.route("/create", methods=["POST"])(Authenticator()(create_milestone))
milestones_bp.route("/project/<project_id>", methods=["GET"])(Authenticator()(get_milestones_by_project))
