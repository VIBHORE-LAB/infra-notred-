from flask import Blueprint
from app.controllers import user

user_bp = Blueprint('user', __name__)

user_bp.route("/register/owner", methods=["POST"])(user.register_owner)