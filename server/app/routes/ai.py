from flask import Blueprint
from app.controllers.ai_controller import (
    batch_predict_projects,
    get_portfolio_analytics,
    simulate_project_impact,
    get_milestone_analytics,
    get_ai_summary,
)
from app.middlewares.auth_middleware import Authenticator

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/predict', methods=['POST'])
@Authenticator()
def predict():
    return batch_predict_projects()

@ai_bp.route('/analytics', methods=['GET'])
@Authenticator()
def analytics():
    return get_portfolio_analytics()

@ai_bp.route('/simulate', methods=['POST'])
@Authenticator()
def simulate():
    return simulate_project_impact()

@ai_bp.route('/summary', methods=['GET'])
@Authenticator()
def summary():
    return get_ai_summary()

# Feature 9: Milestone Progress Analytics
@ai_bp.route('/milestones/<project_id>', methods=['GET'])
@Authenticator()
def milestone_analytics(project_id):
    return get_milestone_analytics(project_id)
