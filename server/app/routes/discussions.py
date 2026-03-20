from flask import Blueprint
import app.controllers.discussion_controller as disc

discussions_bp = Blueprint("discussions", __name__)

# All discussion endpoints are PUBLIC — no JWT required
discussions_bp.route("/project/<project_id>/thread", methods=["POST"])(disc.create_thread)
discussions_bp.route("/project/<project_id>", methods=["GET"])(disc.get_threads)
discussions_bp.route("/thread/<thread_id>/reply", methods=["POST"])(disc.reply_to_thread)
discussions_bp.route("/thread/<thread_id>/upvote", methods=["POST"])(disc.upvote_thread)
discussions_bp.route("/thread/<thread_id>/reply/<reply_id>/upvote", methods=["POST"])(disc.upvote_reply)
