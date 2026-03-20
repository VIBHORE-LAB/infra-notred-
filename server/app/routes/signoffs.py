from flask import Blueprint
from app.middlewares.auth_middleware import Authenticator
import app.controllers.signoff_controller as sc

signoffs_bp = Blueprint("signoffs", __name__)

# Create sign-off (owner/admin)
signoffs_bp.route("/", methods=["POST"])(Authenticator()(sc.create_signoff))
# Get all sign-offs for a project — public sees only isPublic=True, auth users see all
signoffs_bp.route("/project/<project_id>", methods=["GET"])(sc.get_signoffs_by_project)
