from flask import Blueprint
from app.middlewares.auth_middleware import Authenticator
import app.controllers.issue_controller as ic

issues_bp = Blueprint("issues", __name__)

# Report an issue (any authenticated user)
issues_bp.route("/", methods=["POST"])(Authenticator()(ic.create_issue))
# List issues (auth users, with optional filters ?severity=High&status=Open&issueType=Structural)
issues_bp.route("/project/<project_id>", methods=["GET"])(Authenticator()(ic.get_issues_by_project))
# Update status + resolve (owner/admin)
issues_bp.route("/<issue_id>/status", methods=["PATCH"])(Authenticator()(ic.update_issue_status))
# Soft delete (owner/admin)
issues_bp.route("/<issue_id>", methods=["DELETE"])(Authenticator()(ic.delete_issue))
