from flask import request, jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.ai_utils import predict_project_delay
from app.utils.response_util import generate_response

def batch_predict_projects():
    data = request.json
    signature = data.get("signature", "batch_predict")
    payload = data.get("payload", {})
    
    projects = payload.get("projects", [])
    
    if not projects:
        return jsonify(generate_response(signature, "batch_predict", "fail", error="No projects provided")), 400
        
    predictions = {}
    for project in projects:
        project_id = project.get("id")
        if project_id:
            prediction = predict_project_delay(project)
            if prediction:
                predictions[project_id] = prediction
                
    return jsonify(generate_response(signature, "batch_predict", "success", data={"predictions": predictions})), 200

def get_portfolio_analytics():
    signature = "get_portfolio_analytics"
    company_code = request.headers.get("x-company-code")
    
    if not company_code:
        return jsonify(generate_response(signature, "get_portfolio_analytics", "fail", error="Company code is required")), 400

    query = {"$or": [
        {"companyCode": company_code},
        {"companyCode": ObjectId(company_code) if ObjectId.is_valid(company_code) else None}
    ]}

    try:
        cursor = mongo.db.projects.find(query)
        projects = list(cursor)
        
        total_budget = 0
        total_spent = 0
        risk_counts = {"High": 0, "Medium": 0, "Low": 0}
        
        for p in projects:
            # Prepare project data for prediction utility
            p_map = {
                "id": str(p["_id"]),
                "timeline": p.get("timeline", {}),
                "funding": p.get("funding", {}),
                "status": p.get("status", "Planned"),
                "teamsize": p.get("teamsize", 10),
                "location": p.get("location", {}),
                "projectType": p.get("projectType", "")
            }
            
            prediction = predict_project_delay(p_map)
            if prediction:
                risk_level = prediction.get("riskLevel", "Low")
                risk_counts[risk_level] = risk_counts.get(risk_level, 0) + 1
            
            funding = p.get("funding", {})
            total_budget += funding.get("estimatedBudget", 0)
            total_spent += funding.get("totalSpent", 0)
            
        analytics = {
            "totalProjects": len(projects),
            "financials": {
                "totalEstimatedBudget": total_budget,
                "totalSpent": total_spent,
                "portfolioUtilization": round((total_spent / total_budget * 100), 2) if total_budget > 0 else 0
            },
            "riskDistribution": risk_counts,
            "overallHealthScore": round(max(0, 100 - (risk_counts["High"] * 25 + risk_counts["Medium"] * 10) / (len(projects) if projects else 1)), 2)
        }
        
        return jsonify(generate_response(signature, "get_portfolio_analytics", "success", data=analytics)), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_portfolio_analytics", "fail", error=str(e))), 500

def simulate_project_impact():
    signature = "simulate_project_impact"
    data = request.json
    payload = data.get("payload", {})
    
    project_id = payload.get("projectId")
    if not project_id:
        return jsonify(generate_response(signature, "simulate_project_impact", "fail", error="projectId is required")), 400

    # Delta values for simulation
    delta_teamsize = payload.get("deltaTeamsize", 0)  # e.g., +5 or -2
    delta_util_percent = payload.get("deltaUtilization", 0)  # e.g., +10% efficiency gain

    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
        if not project:
            return jsonify(generate_response(signature, "simulate_project_impact", "fail", error="Project not found")), 404

        # Prepare original and simulated data
        p_map = {
            "id": str(project["_id"]),
            "timeline": project.get("timeline", {}),
            "funding": project.get("funding", {}),
            "status": project.get("status", "Planned"),
            "teamsize": project.get("teamsize", 10),
            "location": project.get("location", {}),
            "projectType": project.get("projectType", "")
        }

        # Calculate Original Prediction
        original_prediction = predict_project_delay(p_map)

        # Calculate Simulated Prediction
        sim_p_map = p_map.copy()
        sim_p_map["teamsize"] = max(1, p_map["teamsize"] + delta_teamsize)
        
        sim_funding = p_map["funding"].copy()
        sim_funding["utilizationPercent"] = min(100, max(0, sim_funding.get("utilizationPercent", 0) + delta_util_percent))
        sim_p_map["funding"] = sim_funding

        simulated_prediction = predict_project_delay(sim_p_map)

        return jsonify(generate_response(signature, "simulate_project_impact", "success", data={
            "original": original_prediction,
            "simulated": simulated_prediction,
            "impact": {
                "daysSaved": original_prediction["predictedTotalDays"] - simulated_prediction["predictedTotalDays"],
                "riskChange": f"{original_prediction['riskLevel']} -> {simulated_prediction['riskLevel']}"
            }
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "simulate_project_impact", "fail", error=str(e))), 500
