from flask import Blueprint
import app.controllers.public

public_bp = Blueprint('public', __name__)

public_bp.route('/projects', methods=['GET'])(app.controllers.public.get_public_projects)
public_bp.route('/projects/search', methods=['GET'])(app.controllers.public.search_public_projects)
public_bp.route('/projects/<project_id>', methods=['GET'])(app.controllers.public.get_public_project_detail)
public_bp.route('/projects/<project_id>/comments', methods=['POST'])(app.controllers.public.add_project_comment)
public_bp.route('/projects/<project_id>/vote', methods=['POST'])(app.controllers.public.vote_project_thread)
# Feature 3: Star Ratings & Sentiment
public_bp.route('/projects/<project_id>/rate', methods=['POST'])(app.controllers.public.rate_project)
public_bp.route('/projects/<project_id>/ratings', methods=['GET'])(app.controllers.public.get_project_ratings)
# Feature 10: GIS Budget Heatmap
public_bp.route('/heatmap', methods=['GET'])(app.controllers.public.get_budget_heatmap)
