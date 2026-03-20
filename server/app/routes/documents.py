from flask import Blueprint
from app.middlewares.auth_middleware import Authenticator
import app.controllers.document_controller as dc

documents_bp = Blueprint("documents", __name__)

documents_bp.route("/upload", methods=["POST"])(Authenticator()(dc.upload_document))
documents_bp.route("/project/<project_id>", methods=["GET"])(Authenticator()(dc.get_documents_by_project))
documents_bp.route("/<doc_id>", methods=["DELETE"])(Authenticator()(dc.delete_document))
