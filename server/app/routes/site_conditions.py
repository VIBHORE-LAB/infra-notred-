from flask import Blueprint
from app.middlewares.auth_middleware import Authenticator
import app.controllers.site_condition_controller as scc

site_conditions_bp = Blueprint("site_conditions", __name__)

# Log daily site condition (any authenticated user)
site_conditions_bp.route("/", methods=["POST"])(Authenticator()(scc.log_site_condition))
# Get conditions with optional date range filter (auth user)
site_conditions_bp.route("/project/<project_id>", methods=["GET"])(Authenticator()(scc.get_site_conditions))
