from flask import Blueprint
import app.controllers.gallery_controller as gc

gallery_bp = Blueprint("gallery", __name__)

# Public: get photo gallery for a specific project (paginated)
gallery_bp.route("/projects/<project_id>", methods=["GET"])(gc.get_public_photo_gallery)
# Public: get all photos for a company across all projects
gallery_bp.route("/company", methods=["GET"])(gc.get_company_gallery)
