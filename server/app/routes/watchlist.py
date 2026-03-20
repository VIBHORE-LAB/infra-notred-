from flask import Blueprint
import app.controllers.watchlist_controller as wc

watchlist_bp = Blueprint("watchlist", __name__)

# Toggle save/unsave (public — no auth)
watchlist_bp.route("/projects/<project_id>/watch", methods=["POST"])(wc.toggle_watchlist)
# Get watcher count + check if user is watching
watchlist_bp.route("/projects/<project_id>/watchers", methods=["GET"])(wc.get_watcher_count)
# Get all saved projects for a given userId
watchlist_bp.route("/user/<user_id>", methods=["GET"])(wc.get_watchlist)
