from flask import Blueprint
from app.controllers.fund_controller import create_fund_transaction,get_transaction_by_id,get_fund_summary_by_project,get_fund_transaction_by_project
from app.middlewares.auth_middleware import Authenticator

funds_bp = Blueprint("funds", __name__)


funds_bp.route("/create", methods=["POST"])(Authenticator()(create_fund_transaction))
funds_bp.route("/<transaction_id>", methods=["GET"])(Authenticator()(get_transaction_by_id))
funds_bp.route("/fund_summary/<project_id>", methods=["GET"])(Authenticator()(get_fund_summary_by_project))
funds_bp.route("funds_project/<project_id>", methods=["GET"])(Authenticator()(get_fund_transaction_by_project))
