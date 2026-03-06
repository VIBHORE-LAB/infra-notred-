import math
from datetime import datetime

class PredictionResult:
    def __init__(self, predictedTotalDays, riskLevel, confidenceScore, bottlenecks, delayReasoning, onTrack, delayBreakdown):
        self.predictedTotalDays = predictedTotalDays
        self.riskLevel = riskLevel
        self.confidenceScore = confidenceScore
        self.bottlenecks = bottlenecks
        self.delayReasoning = delayReasoning
        self.onTrack = onTrack
        self.delayBreakdown = delayBreakdown

    def to_dict(self):
        return {
            "predictedTotalDays": self.predictedTotalDays,
            "riskLevel": self.riskLevel,
            "confidenceScore": self.confidenceScore,
            "bottlenecks": self.bottlenecks,
            "delayReasoning": self.delayReasoning,
            "onTrack": self.onTrack,
            "delayBreakdown": self.delayBreakdown
        }

def predict_project_delay(project):
    timeline = project.get("timeline", {})
    start_date_str = timeline.get("startDate")
    deadline_str = timeline.get("deadline")
    
    if not start_date_str or not deadline_str:
        return None

    try:
        start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
    except ValueError:
        # Fallback for other formats
        return None

    today = datetime.now(start_date.tzinfo)
    
    estimated_days = max(1, (deadline - start_date).days)
    days_elapsed = max(1, (today - start_date).days)
    
    funding = project.get("funding", {})
    percentage_completed = funding.get("utilizationPercent", 0)
    
    status = project.get("status", "Planned")
    risk_factors = 5 if status == 'On Hold' else 0 if status == 'Planned' else 2
    
    budget_utilization = funding.get("utilizationPercent", 0)
    team_size = project.get("teamsize", 10)
    team_density = team_size / (estimated_days / 30.0)
    
    time_ratio = days_elapsed / estimated_days
    completion_ratio = percentage_completed / 100.0
    risk_ratio = risk_factors / 5.0
    budget_ratio = budget_utilization / 100.0
    
    # Weights for: TimeRatio, CompletionRatio, RiskRatio, BudgetRatio
    # multiplier = 1 + (time_ratio * 0.8 - completion_ratio * 1.2 + risk_ratio * 0.5 + budget_ratio * 0.3)
    # Using the same logic as the V2 model implemented in frontend
    prediction_val = (time_ratio * 0.8) - (completion_ratio * 1.2) + (risk_ratio * 0.5) + (budget_ratio * 0.3)
    multiplier = 1 + prediction_val
    predicted_days = max(estimated_days, round(estimated_days * multiplier))
    
    delay_ratio = predicted_days / estimated_days
    is_ahead = percentage_completed > (time_ratio * 100 + 5)
    is_on_track = not is_ahead and abs(percentage_completed - (time_ratio * 100)) <= 5
    
    risk_level = 'Low'
    if delay_ratio > 1.4 or (budget_utilization > percentage_completed + 20):
        risk_level = 'High'
    elif delay_ratio > 1.15 or risk_factors > 2:
        risk_level = 'Medium'
        
    confidence_score = max(0.65, 1 - (risk_factors * 0.08) - (abs(percentage_completed/100.0 - budget_utilization/100.0) * 0.15))
    
    possible_bottlenecks = [
        "Material Supply Chain",
        "Labor Availability",
        "Environmental Clearances",
        "Funding Disbursement",
        "Technical Complexity",
        "Regulatory Approvals",
        "Site Logistics"
    ]
    
    bottlenecks = []
    if risk_factors > 3:
        bottlenecks.append(possible_bottlenecks[risk_factors % 7])
        bottlenecks.append(possible_bottlenecks[(risk_factors + 2) % 7])
    elif risk_factors > 0:
        bottlenecks.append(possible_bottlenecks[risk_factors % 7])
        
    if budget_utilization > percentage_completed + 15:
        bottlenecks.append("Capital Inefficiency")
    if team_density < 2:
        bottlenecks.append("Understaffing Risk")
        
    bottlenecks = list(set(bottlenecks))
    
    delay_reasoning = ""
    time_consumed_percent = round(time_ratio * 100)
    budget_overrun = budget_utilization - percentage_completed
    city = project.get("location", {}).get("city", "Site")
    project_type = project.get("projectType", "infrastructure")

    if is_ahead:
        delay_reasoning = f"Optimized execution detected. Project is {round(percentage_completed - time_ratio * 100)}% ahead of schedule with high labor efficiency in {city}."
    elif is_on_track:
        delay_reasoning = "Operational excellence maintained. Resource allocation matches physical progress metrics within a 5% variance margin."
    else:
        if budget_overrun > 20:
            delay_reasoning = f"Financial-Physical decoupling: {budget_utilization}% budget spent vs {percentage_completed}% work done. High risk of liquidity-induced stoppage."
        elif time_consumed_percent > percentage_completed + 15:
            delay_reasoning = f"Velocity mismatch. Time exhaustion ({time_consumed_percent}%) significantly outpaces verified work ({percentage_completed}%). Typical of {project_type} bottlenecks."
        elif risk_factors > 3:
            delay_reasoning = f"Critical path blocked by external environmental factors and {bottlenecks[0] if bottlenecks else 'compliance issues'}. Timeline recovery depends on site clearance."
        else:
            delay_reasoning = f"Minor logistical friction in {city}. Predicted delay is manageable through secondary resource surge and team size optimization."

    return {
        "predictedTotalDays": predicted_days,
        "riskLevel": risk_level,
        "confidenceScore": round(confidence_score, 2),
        "bottlenecks": bottlenecks,
        "delayReasoning": delay_reasoning,
        "onTrack": is_on_track or is_ahead,
        "delayBreakdown": {
            "baseTimeline": estimated_days,
            "scheduleSlippage": max(0, predicted_days - estimated_days),
            "riskAdjustments": risk_factors * 1.5
        }
    }
