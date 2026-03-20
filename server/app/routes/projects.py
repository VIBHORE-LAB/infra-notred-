from flask import Blueprint
import app.controllers.project
from app.middlewares.auth_middleware import Authenticator

project_bp = Blueprint('projects', __name__)
project_bp.route("/", methods=["GET"])(Authenticator()(app.controllers.project.get_all_projects))
project_bp.route("/create", methods=["POST"])(Authenticator()(app.controllers.project.create_project))
project_bp.route("/<project_id>", methods=["GET"])(Authenticator()(app.controllers.project.get_project_by_id))
project_bp.route("/addAdmin", methods=["POST"])(Authenticator()(app.controllers.project.add_admin_to_project))
# Feature 7: Tags
project_bp.route("/<project_id>/tags", methods=["POST"])(Authenticator()(app.controllers.project.add_tags_to_project))
project_bp.route("/<project_id>/tags", methods=["DELETE"])(Authenticator()(app.controllers.project.remove_tag_from_project))
project_bp.route("/tags", methods=["GET"])(Authenticator()(app.controllers.project.get_available_project_tags))
project_bp.route("/by-tag", methods=["GET"])(Authenticator()(app.controllers.project.get_projects_by_tag))
project_bp.route("/bulk-tags", methods=["POST"])(Authenticator()(app.controllers.project.bulk_add_tags_to_projects))
# Feature 13: Bulk Status Update
project_bp.route("/bulk-status", methods=["POST"])(Authenticator()(app.controllers.project.bulk_update_project_status))
