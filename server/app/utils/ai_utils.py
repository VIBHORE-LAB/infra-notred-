import math
from datetime import datetime, timedelta

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
    # Base configuration
    timeline = project.get("timeline", {})
    funding = project.get("funding", {})
    status = project.get("status", "Planned")
    created_at_str = project.get("createdAt")
    
    # 1. Resolve Start Date and Deadline with Fallbacks
    start_date_str = timeline.get("startDate")
    deadline_str = timeline.get("deadline")
    
    # Fallback to createdAt if no startDate
    if not start_date_str:
        start_date_str = created_at_str or datetime.now().isoformat()
        
    # Fallback to +365 days if no deadline
    if not deadline_str:
        try:
            def parse_date_simple(ds):
                if not isinstance(ds, str): return datetime.now()
                clean = ds.replace('Z', '+00:00')
                if ' ' in clean: clean = clean.split(' ')[0]
                try: return datetime.fromisoformat(clean)
                except Exception: return datetime.now()
            
            sd = parse_date_simple(start_date_str)
            deadline_dt = sd + timedelta(days=365)
            deadline_str = deadline_dt.isoformat()
        except Exception:
            deadline_str = (datetime.now() + timedelta(days=365)).isoformat()

    try:
        # Robust parsing for ISO and simple YYYY-MM-DD
        def parse_date(ds):
            if not isinstance(ds, str): return datetime.now()
            clean = ds.replace('Z', '+00:00')
            if ' ' in clean: clean = clean.split(' ')[0] # Handle space-separated time
            try:
                return datetime.fromisoformat(clean)
            except ValueError:
                try:
                    return datetime.strptime(clean[:10], "%Y-%m-%d")
                except Exception:
                    return datetime.now()

        start_date = parse_date(start_date_str)
        deadline = parse_date(deadline_str)
    except Exception:
        # Final fallback to avoid crash
        start_date = datetime.now()
        deadline = start_date + timedelta(days=365)

    # Ensure tzinfo is handled
    today = datetime.now(start_date.tzinfo if start_date.tzinfo else None)
    
    estimated_days = max(1, (deadline - start_date).days)
    days_elapsed = max(0, (today - start_date).days)
    
    # 2. Extract Progress Metrics
    percentage_completed = funding.get("utilizationPercent", 0)
    # Risk factor weights
    risk_factors = 5 if status == 'On Hold' else 4 if status == 'Delayed' else 1 if status == 'Cancelled' else 0 if status == 'Planned' else 2
    
    budget_utilization = funding.get("utilizationPercent", 0)
    team_size = project.get("teamsize") or project.get("teamSize", 10)
    team_density = team_size / (estimated_days / 30.0)
    
    # 3. Prediction Algorithm
    time_ratio = days_elapsed / estimated_days if estimated_days > 0 else 1
    completion_ratio = percentage_completed / 100.0
    risk_ratio = risk_factors / 5.0
    budget_ratio = budget_utilization / 100.0
    
    # Multiplier Logic
    prediction_val = (time_ratio * 0.8) - (completion_ratio * 1.2) + (risk_ratio * 0.5) + (budget_ratio * 0.3)
    multiplier = 1 + max(-0.2, min(0.8, prediction_val)) # Cap influence
    
    predicted_days = max(estimated_days, round(estimated_days * multiplier))
    delay_ratio = predicted_days / estimated_days
    
    is_ahead = percentage_completed > (time_ratio * 100 + 5)
    is_on_track = not is_ahead and abs(percentage_completed - (time_ratio * 100)) <= 10
    
    # 4. Categorization
    risk_level = 'Low'
    if delay_ratio > 1.35 or (budget_utilization > percentage_completed + 25):
        risk_level = 'High'
    elif delay_ratio > 1.1 or risk_factors >= 3:
        risk_level = 'Medium'
        
    confidence_score = max(0.6, 1 - (risk_factors * 0.07) - (abs(percentage_completed/100.0 - budget_utilization/100.0) * 0.15))
    
    possible_bottlenecks = [
        "Material Supply Chain", "Labor Availability", "Environmental Clearances",
        "Funding Disbursement", "Technical Complexity", "Regulatory Approvals", "Site Logistics"
    ]
    
    bottlenecks = []
    if risk_factors >= 3:
        bottlenecks.append(possible_bottlenecks[risk_factors % 7])
    if budget_utilization > percentage_completed + 10:
        bottlenecks.append("Capital Inefficiency")
    if team_density < 1.5:
        bottlenecks.append("Understaffing Risk")
    bottlenecks = list(set(bottlenecks))
    
    # 5. Reasoning Generation
    time_consumed_percent = round(time_ratio * 100)
    budget_overrun = budget_utilization - percentage_completed
    city = project.get("location", {}).get("city", "the site")
    project_type = project.get("projectType", "infrastructure project")

    if is_ahead:
        delay_reasoning = f"Optimized execution detected. Project is {round(percentage_completed - time_ratio * 100)}% ahead of schedule in {city}."
    elif is_on_track:
        delay_reasoning = "Operational excellence maintained. Resource allocation matches physical progress metrics."
    else:
        if budget_overrun > 15:
            delay_reasoning = f"Financial strain: {budget_utilization}% budget spent vs {percentage_completed}% work done. Risk of capital exhaustion."
        elif time_consumed_percent > percentage_completed + 10:
            delay_reasoning = f"Velocity mismatch. Time exhaustion ({time_consumed_percent}%) outpaces work ({percentage_completed}%). Typical of {project_type} delays."
        else:
            delay_reasoning = f"Structural logistical friction in {city}. Predicted delay is manageable through resource surge."

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
