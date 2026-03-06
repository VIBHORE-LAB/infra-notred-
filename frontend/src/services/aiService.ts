import instance from "../api/api";

export interface PredictionResult {
  predictedTotalDays: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  confidenceScore: number;
  bottlenecks: string[];
  delayReasoning: string;
  onTrack: boolean;
  delayBreakdown: {
    baseTimeline: number;
    scheduleSlippage: number;
    riskAdjustments: number;
  };
}

export interface PortfolioAnalytics {
  totalProjects: number;
  financials: {
    totalEstimatedBudget: number;
    totalSpent: number;
    portfolioUtilization: number;
  };
  riskDistribution: {
    High: number;
    Medium: number;
    Low: number;
  };
  overallHealthScore: number;
}

export interface SimulationImpact {
  original: PredictionResult;
  simulated: PredictionResult;
  impact: {
    daysSaved: number;
    riskChange: string;
  };
}

export const batchPredictProjects = async (projects: any[]): Promise<Map<string, PredictionResult>> => {
  const predictions = new Map<string, PredictionResult>();
  
  try {
    const res = await instance.post('/ai/predict', {
      signature: "batch_predict_projects",
      payload: { projects }
    }, {
        headers: {
            "x-company-code": localStorage.getItem("companyCode") || ""
        }
    });

    const backendPredictions = res.data?.data?.predictions || {};
    
    Object.entries(backendPredictions).forEach(([projectId, pred]: [string, any]) => {
      predictions.set(projectId, pred);
    });
  } catch (error) {
    console.error("AI Prediction Error:", error);
  }
  
  return predictions;
};

export const getPortfolioAnalytics = async (): Promise<PortfolioAnalytics | null> => {
  try {
    const res = await instance.get('/ai/analytics', {
      headers: {
        "x-company-code": localStorage.getItem("companyCode") || ""
      }
    });
    return res.data?.data || null;
  } catch (error) {
    console.error("Portfolio Analytics Error:", error);
    return null;
  }
};

export const simulateProjectImpact = async (
  projectId: string, 
  deltaTeamsize: number, 
  deltaUtilization: number
): Promise<SimulationImpact | null> => {
  try {
    const res = await instance.post('/ai/simulate', {
      payload: { projectId, deltaTeamsize, deltaUtilization }
    }, {
      headers: {
        "x-company-code": localStorage.getItem("companyCode") || ""
      }
    });
    return res.data?.data || null;
  } catch (error) {
    console.error("AI Simulation Error:", error);
    return null;
  }
};
