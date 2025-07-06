from flask import Blueprint
import app.controllers.project  
from app.middlewares.auth_middleware import Authenticator

project_bp = Blueprint('projects', __name__)
project_bp.route("/create", methods=["POST"])(Authenticator()(app.controllers.project.create_project))
