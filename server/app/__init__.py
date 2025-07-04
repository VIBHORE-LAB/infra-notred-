from flask import Flask
from flask_cors import CORS
from flask_pymongo import PyMongo
from dotenv import load_dotenv
import os

mongo = PyMongo()

def create_app():
    load_dotenv()

    print("[DEBUG] JWT_SECRET:", os.getenv("JWT_SECRET"))
    print("[DEBUG] MONGO_URI:", os.getenv("MONGO_URI"))

    app = Flask(__name__)
    CORS(app)

    app.config["MONGO_URI"] = os.getenv("MONGO_URI")
    print("[DEBUG] Flask MONGO_URI:", app.config["MONGO_URI"])

    mongo.init_app(app)
    print("[DEBUG] mongo.db:", mongo.db)

    from app.routes.user import user_bp
    app.register_blueprint(user_bp, url_prefix='/infrared/api/v1/user')

    return app
