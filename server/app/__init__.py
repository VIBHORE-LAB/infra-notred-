from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

from app.routes.user import user_bp
from app.routes.company import company_bp
from app.routes.projects import project_bp
from app.routes.project_updates import project_updates_bp
from app.routes.funds import funds_bp
from app.routes.milestones import milestones_bp
from app.routes.progress_report import progress_report_bp
from app.routes.public import public_bp
from app.routes.ai import ai_bp
from app.extensions import mongo  

def create_app():
    load_dotenv()

    # DEBUG: Check if MONGO_URI is loaded
    mongo_uri = os.getenv("MONGO_URI")
    print(f"[DEBUG] MONGO_URI loaded: {'✅ Yes' if mongo_uri else '❌ No - check your .env file!'}")

    import cloudinary
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True
    )

    app = Flask(__name__)
    CORS(app, resources={r"/infrared/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "x-company-code", "x-public-user-id"]
    }})

    app.config["MONGO_URI"] = os.getenv("MONGO_URI")
    app.config["MONGO_DBNAME"] = "infradb"
    mongo.init_app(app)

    app.register_blueprint(user_bp, url_prefix='/infrared/api/v1/user')
    app.register_blueprint(company_bp, url_prefix='/infrared/api/v1/company')
    app.register_blueprint(project_bp, url_prefix='/infrared/api/v1/projects')
    app.register_blueprint(project_updates_bp,url_prefix='/infrared/api/v1/project-updates')
    app.register_blueprint(funds_bp,url_prefix='/infrared/api/v1/funds')
    app.register_blueprint(milestones_bp,url_prefix='/infrared/api/v1/milestones')
    app.register_blueprint(progress_report_bp,url_prefix='/infrared/api/v1/progress-reports')
    app.register_blueprint(public_bp, url_prefix='/infrared/api/v1/public')
    app.register_blueprint(ai_bp, url_prefix='/infrared/api/v1/ai')
    return app
