import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography } from '@mui/material';
import { PredictionResult } from '../services/aiService';
import { Project } from '../hooks/useProjects';

interface AiRiskSummaryWidgetProps {
    projects: Project[];
    predictions: Map<string, PredictionResult>;
    loading: boolean;
}

const AiRiskSummaryWidget: React.FC<AiRiskSummaryWidgetProps> = ({ projects, predictions, loading }) => {
    const navigate = useNavigate();

    const stats = useMemo(() => {
        if (predictions.size === 0) return null;

        const values = Array.from(predictions.values());
        const highRiskCount = values.filter(p => p.riskLevel === 'High').length;
        const medRiskCount = values.filter(p => p.riskLevel === 'Medium').length;

        // Sort projects by delay
        const sortedProjects = projects
            .filter(p => predictions.has(p.id))
            .sort((a, b) => {
                const predA = predictions.get(a.id)!;
                const predB = predictions.get(b.id)!;
                return (predB.predictedTotalDays - predB.delayBreakdown.baseTimeline) -
                    (predA.predictedTotalDays - predA.delayBreakdown.baseTimeline);
            })
            .slice(0, 3);

        return {
            highRiskCount,
            medRiskCount,
            totalAnalyzed: predictions.size,
            topRisks: sortedProjects
        };
    }, [projects, predictions]);

    if (loading) {
        return (
            <section className="app-surface p-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f5fa8] mb-4"></div>
                <p className="text-sm text-slate-500">Analyzing portfolio risk...</p>
            </section>
        );
    }

    if (!stats) {
        return (
            <section className="app-surface p-6">
                <Typography variant="h6" className="font-semibold text-slate-900 mb-2">AI Risk Insights</Typography>
                <p className="text-sm text-slate-500 italic">No prediction data available. Run analysis to see insights.</p>
            </section>
        );
    }

    return (
        <section className="app-surface p-6 flex flex-col bg-gradient-to-br from-white to-slate-50 border-blue-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Typography variant="h6" className="font-semibold text-slate-900">AI Risk Intelligence</Typography>
                    <p className="text-xs text-slate-500">Enterprise-wide predictive analysis</p>
                </div>
                <div className="flex gap-2">
                    {stats.highRiskCount > 0 && (
                        <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            {stats.highRiskCount} Critical
                        </span>
                    )}
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {stats.totalAnalyzed} Monitored
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col items-center">
                    <span className="text-3xl font-bold text-rose-600">{stats.highRiskCount}</span>
                    <span className="text-[10px] text-slate-500 font-medium uppercase mt-1">High Risk Projects</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col items-center">
                    <span className="text-3xl font-bold text-amber-500">{stats.medRiskCount}</span>
                    <span className="text-[10px] text-slate-500 font-medium uppercase mt-1">At Risk Potential</span>
                </div>
            </div>

            <div className="space-y-3 mb-6">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Top Delay Risks</p>
                {stats.topRisks.map(project => {
                    const pred = predictions.get(project.id)!;
                    const delay = pred.predictedTotalDays - pred.delayBreakdown.baseTimeline;
                    return (
                        <div key={project.id} className="flex items-center justify-between group">
                            <div className="min-w-0 pr-4">
                                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-[#0f5fa8] transition-colors">{project.name}</p>
                                <p className="text-[10px] text-slate-500">Conf: {(pred.confidenceScore * 100).toFixed(0)}% • {pred.bottlenecks[0] || 'Unstable'}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className={`text-sm font-bold ${pred.riskLevel === 'High' ? 'text-rose-600' : 'text-amber-600'}`}>
                                    +{delay}d
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={() => navigate('/ai-analysis')}
                className="w-full mt-auto rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-[0.98]"
            >
                View Detailed Intelligence →
            </button>
        </section>
    );
};

export default AiRiskSummaryWidget;
