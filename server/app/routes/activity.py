from flask import Blueprint
from app.middlewares.auth_middleware import Authenticator
import app.controllers.activity_controller as ac

activity_bp = Blueprint("activity", __name__)

activity_bp.route("/project/<project_id>", methods=["GET"])(Authenticator()(ac.get_project_activity))
activity_bp.route("/company", methods=["GET"])(Authenticator()(ac.get_company_activity))
activity_bp.route("/seed-demo", methods=["POST"])(Authenticator()(ac.seed_demo_data))
