from flask import Blueprint
from app.controllers import user
from app.middlewares.auth_middleware import Authenticator

user_bp = Blueprint('user', __name__)

@user_bp.route("/register/owner", methods=["POST"])
def register_owner_route():
    return user.register_owner()


@user_bp.route("/register/user",methods=["POST"])
def register_user_route():
    return user.register_user()




@user_bp.route("/login", methods=["POST"])
def login_user_route():
    return user.login_user()

@user_bp.route("/company-users", methods=["GET"])
@Authenticator()    
def get_users_by_company_route():
    return user.get_users_by_company()


@user_bp.route("/<user_id>", methods=["GET"])
@Authenticator()
def get_user_by_id_route(user_id):
    return user.get_user_by_id(user_id)