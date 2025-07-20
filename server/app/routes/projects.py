from flask import Blueprint
import app.controllers.project  
from app.middlewares.auth_middleware import Authenticator

project_bp = Blueprint('projects', __name__)
project_bp.route("/create", methods=["POST"])(Authenticator()(app.controllers.project.create_project))
project_bp.route("/<project_id>", methods=["GET"])(Authenticator()(app.controllers.project.get_project_by_id))
project_bp.route("/addAdmin",methods=["POST"])(Authenticator()(app.controllers.project.add_admin_to_project))