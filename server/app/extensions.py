from pymongo import MongoClient
import os

class MongoDB:
    """Simple wrapper that mimics the flask-pymongo mongo.db interface."""
    def __init__(self):
        self._db = None

    def init_app(self, app):
        uri = app.config.get("MONGO_URI")
        db_name = app.config.get("MONGO_DBNAME", "infradb")
        if not uri:
            raise RuntimeError("MONGO_URI env var is not set. Cannot start the application.")
        client = MongoClient(uri)
        self._db = client[db_name]
        print(f"[DEBUG] MongoDB connected to database: '{db_name}'")

    @property
    def db(self):
        return self._db

mongo = MongoDB()
