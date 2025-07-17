from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

from app.routes.user import user_bp
from app.routes.company import company_bp
from app.routes.projects import project_bp
from app.routes.project_updates import project_updates_bp
from app.extensions import mongo  

def create_app():
    load_dotenv()

    app = Flask(__name__)
    CORS(app)

    app.config["MONGO_URI"] = os.getenv("MONGO_URI")
    mongo.init_app(app)

    app.register_blueprint(user_bp, url_prefix='/infrared/api/v1/user')
    app.register_blueprint(company_bp, url_prefix='/infrared/api/v1/company')
    app.register_blueprint(project_bp, url_prefix='/infrared/api/v1/projects')
    app.register_blueprint(project_updates_bp,url_prefix='/infrared/api/v1/project-updates')
    return app
