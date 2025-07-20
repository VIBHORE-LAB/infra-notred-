from flask import Blueprint
from app.controllers.project_updater import create_project_update,get_project_update
from app.middlewares.auth_middleware import Authenticator

project_updates_bp = Blueprint('project-updates', __name__)

project_updates_bp.route("/create", methods=["POST"])(Authenticator()(create_project_update))
project_updates_bp.route("/<update_id>", methods=["GET"])(Authenticator()(get_project_update))
