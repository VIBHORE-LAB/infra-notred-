from flask import Blueprint
import app.controllers.company  
from app.middlewares.auth_middleware import Authenticator

company_bp = Blueprint('company', __name__)
company_bp.route("/create", methods=["POST"])(Authenticator()(app.controllers.company.create_company))
company_bp.route("/<company_id>", methods=["GET"])(Authenticator()(app.controllers.company.get_company_by_id))

    