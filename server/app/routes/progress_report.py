from flask import Blueprint
from app.controllers.progress_report import create_report, get_reports_by_project, get_all_company_reports
from app.middlewares.auth_middleware import Authenticator

progress_report_bp = Blueprint('progress_report', __name__)

@progress_report_bp.route("/", methods=["POST"])
@Authenticator()
def create_report_route():
    return create_report()

@progress_report_bp.route("/all", methods=["GET"])
@Authenticator()
def get_all_company_reports_route():
    return get_all_company_reports()

@progress_report_bp.route("/project/<project_id>", methods=["GET"])
@Authenticator()
def get_reports_by_project_route(project_id):
    return get_reports_by_project(project_id)
