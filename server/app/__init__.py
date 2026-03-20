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
# New Feature Blueprints
from app.routes.notifications import notifications_bp
from app.routes.activity import activity_bp
from app.routes.announcements import announcements_bp
from app.routes.documents import documents_bp
from app.routes.discussions import discussions_bp
from app.routes.timeline import timeline_bp
# Round 2 Feature Blueprints
from app.routes.issues import issues_bp
from app.routes.watchlist import watchlist_bp
from app.routes.site_conditions import site_conditions_bp
from app.routes.gallery import gallery_bp
from app.routes.signoffs import signoffs_bp
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

    # ── CORS — strictly from environment, no hardcoded fallbacks ────────────
    raw_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")
    allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
    if not allowed_origins:
        print("[WARNING] CORS_ALLOWED_ORIGINS is not set. All cross-origin requests will be blocked.")

    CORS(app, resources={"/infrared/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": [
            "Content-Type", "Authorization",
            "x-company-code", "x-public-user-id", "x-signature",
        ],
    }})

    app.config["MONGO_URI"] = os.getenv("MONGO_URI")
    app.config["MONGO_DBNAME"] = "infradb"
    mongo.init_app(app)

    # Core blueprints
    app.register_blueprint(user_bp, url_prefix='/infrared/api/v1/user')
    app.register_blueprint(company_bp, url_prefix='/infrared/api/v1/company')
    app.register_blueprint(project_bp, url_prefix='/infrared/api/v1/projects')
    app.register_blueprint(project_updates_bp, url_prefix='/infrared/api/v1/project-updates')
    app.register_blueprint(funds_bp, url_prefix='/infrared/api/v1/funds')
    app.register_blueprint(milestones_bp, url_prefix='/infrared/api/v1/milestones')
    app.register_blueprint(progress_report_bp, url_prefix='/infrared/api/v1/progress-reports')
    app.register_blueprint(public_bp, url_prefix='/infrared/api/v1/public')
    app.register_blueprint(ai_bp, url_prefix='/infrared/api/v1/ai')
    # New Feature Blueprints
    app.register_blueprint(notifications_bp, url_prefix='/infrared/api/v1/notifications')
    app.register_blueprint(activity_bp, url_prefix='/infrared/api/v1/activity')
    app.register_blueprint(announcements_bp, url_prefix='/infrared/api/v1/announcements')
    app.register_blueprint(documents_bp, url_prefix='/infrared/api/v1/documents')
    app.register_blueprint(discussions_bp, url_prefix='/infrared/api/v1/discussions')
    app.register_blueprint(timeline_bp, url_prefix='/infrared/api/v1/timeline')
    # Round 2 Feature Blueprints
    app.register_blueprint(issues_bp, url_prefix='/infrared/api/v1/issues')
    app.register_blueprint(watchlist_bp, url_prefix='/infrared/api/v1/watchlist')
    app.register_blueprint(site_conditions_bp, url_prefix='/infrared/api/v1/site-conditions')
    app.register_blueprint(gallery_bp, url_prefix='/infrared/api/v1/gallery')
    app.register_blueprint(signoffs_bp, url_prefix='/infrared/api/v1/signoffs')

    @app.route("/health")
    def health():
        return {"status": "ok"}, 200

    return app
