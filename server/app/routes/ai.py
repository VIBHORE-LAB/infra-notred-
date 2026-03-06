from flask import Blueprint
from app.controllers.ai_controller import batch_predict_projects, get_portfolio_analytics, simulate_project_impact

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/predict', methods=['POST'])
def predict():
    return batch_predict_projects()

@ai_bp.route('/analytics', methods=['GET'])
def analytics():
    return get_portfolio_analytics()

@ai_bp.route('/simulate', methods=['POST'])
def simulate():
    return simulate_project_impact()
