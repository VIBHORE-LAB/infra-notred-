from flask import request, jsonify
from bson import ObjectId
from app.extensions import mongo
from app.utils.ai_utils import predict_project_delay
from app.utils.response_util import generate_response

def batch_predict_projects():
    signature = "batch_predict_projects"
    try:
        data = request.json
        payload = data.get("payload", {})
        projects = payload.get("projects", [])
        
        if not projects:
            return jsonify(generate_response(signature, "batch_predict", "fail", error="No projects provided")), 400
            
        predictions = {}
        for project in projects:
            project_id = project.get("id")
            if project_id:
                try:
                    prediction = predict_project_delay(project)
                    if prediction:
                        predictions[project_id] = prediction
                except Exception as e:
                    print(f"[ERROR] Prediction failed for project {project_id}: {str(e)}")
                    continue
                    
        return jsonify(generate_response(signature, "batch_predict", "success", data={"predictions": predictions})), 200
    except Exception as e:
        return jsonify(generate_response(signature, "batch_predict", "fail", error=str(e))), 500


def get_ai_summary():
    """GET /infrared/api/v1/ai/summary — Server-side global prediction summary"""
    signature = "get_ai_summary"
    company_code = request.headers.get("x-company-code")
    
    if not company_code:
        return jsonify(generate_response(signature, "get_ai_summary", "fail", error="Company code required")), 400

    try:
        projects = list(mongo.db.projects.find({"companyCode": company_code}))
        if not projects:
            return jsonify(generate_response(signature, "get_ai_summary", "success", data={
                "predictions": {},
                "stats": {"highRiskCount": 0, "medRiskCount": 0, "totalAnalyzed": 0, "topRisks": []}
            })), 200

        predictions = {}
        for p in projects:
            p_map = {
                "id": str(p["_id"]),
                "name": p.get("name", ""),
                "timeline": p.get("timeline", {}),
                "funding": p.get("funding", {}),
                "status": p.get("status", "Planned"),
                "teamsize": p.get("teamsize", 10),
                "location": p.get("location", {}),
                "projectType": p.get("projectType", ""),
                "createdAt": p.get("createdAt").isoformat() if p.get("createdAt") and hasattr(p.get("createdAt"), 'isoformat') else None
            }
            try:
                pred = predict_project_delay(p_map)
                if pred:
                    predictions[p_map["id"]] = pred
            except Exception as e:
                print(f"[ERROR] Prediction failed for {p_map['id']}: {str(e)}")

        # Calculate Stats
        values = list(predictions.values())
        high_risk_count = len([v for v in values if v["riskLevel"] == "High"])
        med_risk_count = len([v for v in values if v["riskLevel"] == "Medium"])
        
        # Sort for top risks (most delay)
        top_risks_ids = sorted(
            predictions.keys(),
            key=lambda k: (predictions[k]["predictedTotalDays"] - predictions[k]["delayBreakdown"]["baseTimeline"]),
            reverse=True
        )[:3]
        
        # Format top risks for frontend
        top_risks = []
        for rid in top_risks_ids:
            p = next((p for p in projects if str(p["_id"]) == rid), None)
            if p:
                top_risks.append({
                    "id": rid,
                    "name": p.get("name", "Unknown Project")
                })

        return jsonify(generate_response(signature, "get_ai_summary", "success", data={
            "predictions": predictions,
            "stats": {
                "highRiskCount": high_risk_count,
                "medRiskCount": med_risk_count,
                "totalAnalyzed": len(predictions),
                "topRisks": top_risks
            }
        })), 200
    except Exception as e:
        return jsonify(generate_response(signature, "get_ai_summary", "fail", error=str(e))), 500

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


# ─────────────────────────────────────────────────────────────────────────────
# FEATURE 9: Milestone Progress Analytics
# ─────────────────────────────────────────────────────────────────────────────

def get_milestone_analytics(project_id):
    """GET /infrared/api/v1/ai/milestones/<project_id>"""
    from datetime import datetime
    signature = "get_milestone_analytics"

    if not ObjectId.is_valid(project_id):
        return jsonify(generate_response(signature, "get_milestone_analytics", "fail", error="Invalid project ID")), 400

    try:
        milestones = list(mongo.db.milestones.find({"projectId": ObjectId(project_id)}))

        if not milestones:
            return jsonify(generate_response(signature, "get_milestone_analytics", "success", {
                "projectId": project_id,
                "totalMilestones": 0,
                "message": "No milestones found for this project",
            })), 200

        now = datetime.utcnow()
        total = len(milestones)
        status_counts = {}
        overdue = 0
        completion_days = []
        progress_values = []

        for m in milestones:
            status = m.get("status", "Planned")
            status_counts[status] = status_counts.get(status, 0) + 1

            progress_values.append(m.get("progress", 0))

            end_date_raw = m.get("endDate")
            created_at = m.get("createdAt", now)
            last_updated = m.get("lastUpdatedAt", now)

            # Check overdue: not completed and past end_date
            if status not in ["Completed", "Cancelled"] and end_date_raw:
                try:
                    end_dt = datetime.fromisoformat(end_date_raw.replace("Z", "")) if isinstance(end_date_raw, str) else end_date_raw
                    if end_dt < now:
                        overdue += 1
                except Exception:
                    pass

            # Average completion time for completed milestones
            if status == "Completed":
                try:
                    start_raw = m.get("startDate")
                    if start_raw and end_date_raw:
                        start_dt = datetime.fromisoformat(start_raw.replace("Z", "")) if isinstance(start_raw, str) else start_raw
                        end_dt = datetime.fromisoformat(end_date_raw.replace("Z", "")) if isinstance(end_date_raw, str) else end_date_raw
                        days = (end_dt - start_dt).days
                        if days >= 0:
                            completion_days.append(days)
                except Exception:
                    pass

        completed_count = status_counts.get("Completed", 0)
        completion_rate = round((completed_count / total) * 100, 1)
        avg_progress = round(sum(progress_values) / total, 1)
        avg_completion_days = round(sum(completion_days) / len(completion_days), 1) if completion_days else None

        # Simple burn-up projection: if we know avg days/milestone, estimate remaining
        remaining = total - completed_count
        projected_days_to_finish = (
            round(remaining * avg_completion_days) if avg_completion_days and remaining > 0 else None
        )

        return jsonify(generate_response(signature, "get_milestone_analytics", "success", {
            "projectId": project_id,
            "totalMilestones": total,
            "completionRate": completion_rate,
            "averageProgress": avg_progress,
            "overdueCount": overdue,
            "completedCount": completed_count,
            "remainingCount": remaining,
            "statusBreakdown": status_counts,
            "averageCompletionDays": avg_completion_days,
            "projectedDaysToFinish": projected_days_to_finish,
        })), 200

    except Exception as e:
        return jsonify(generate_response(signature, "get_milestone_analytics", "fail", error=str(e))), 500
