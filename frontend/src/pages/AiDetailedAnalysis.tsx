import React, { useState, useEffect, useMemo } from 'react';
import { Typography } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import StopIcon from '@mui/icons-material/Stop';
import { useProjects } from '../hooks/useProjects';
import { batchPredictProjects, PredictionResult, simulateProjectImpact, SimulationImpact } from '../services/aiService';
import { Modal, Box, Slider, Button as MuiButton } from '@mui/material';
import PortfolioRadar from '../components/PortfolioRadar';

const AiDetailedAnalysis: React.FC = () => {
    const { fetchAllProjects, projects, loading: projectsLoading } = useProjects();
    const [predictions, setPredictions] = useState<Map<string, PredictionResult>>(new Map());
    const [analyzing, setAnalyzing] = useState(false);

    // Simulation state
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [simData, setSimData] = useState<SimulationImpact | null>(null);
    const [simLoading, setSimLoading] = useState(false);
    const [deltaTeamsize, setDeltaTeamsize] = useState(0);
    const [deltaUtilization, setDeltaUtilization] = useState(0);

    const [speaking, setSpeaking] = useState(false);

    const pickPreferredVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices.length) return null;

        const preferredNames = [
            'Google UK English Female',
            'Google US English',
            'Samantha',
            'Microsoft Aria',
            'Microsoft Jenny',
            'Karen',
            'Moira',
            'Rishi',
        ];

        for (const name of preferredNames) {
            const match = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
            if (match) return match;
        }

        const english = voices.find(v => v.lang?.toLowerCase().startsWith('en-in'))
            || voices.find(v => v.lang?.toLowerCase().startsWith('en-gb'))
            || voices.find(v => v.lang?.toLowerCase().startsWith('en-us'))
            || voices.find(v => v.lang?.toLowerCase().startsWith('en'));

        return english || voices[0];
    };

    useEffect(() => {
        const init = async () => {
            const list = await fetchAllProjects();
            if (list && list.length > 0) {
                setAnalyzing(true);
                const res = await batchPredictProjects(list);
                setPredictions(res);
                setAnalyzing(false);
            }
        };
        init();
    }, [fetchAllProjects]);

    const { highRiskProjects, healthyProjects, stats } = useMemo(() => {
        const list = Array.from(predictions.entries()).map(([id, pred]) => ({
            id,
            project: projects.find(p => p.id === id)!,
            pred
        })).filter(item => item.project);

        const highRisk = list.filter(item => !item.pred.onTrack);
        const healthy = list.filter(item => item.pred.onTrack);

        const statsResult = list.length === 0 ? null : {
            total: list.length,
            highRisk: list.filter(item => item.pred.riskLevel === 'High').length,
            avgConfidence: list.reduce((acc, item) => acc + item.pred.confidenceScore, 0) / list.length,
            totalDelay: list.reduce((acc, item) => acc + (item.pred.predictedTotalDays - item.pred.delayBreakdown.baseTimeline), 0)
        };

        return { highRiskProjects: highRisk, healthyProjects: healthy, stats: statsResult };
    }, [predictions, projects]);

    const handleSimulate = async () => {
        if (!selectedProject) return;
        setSimLoading(true);
        const result = await simulateProjectImpact(selectedProject.id, deltaTeamsize, deltaUtilization);
        setSimData(result);
        setSimLoading(false);
    };

    const handleVoiceBriefing = () => {
        if (speaking) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
            return;
        }

        if (!stats) return;

        const text = `High-level Portfolio Intelligence Report. We are currently monitoring ${projects.length} infrastructure projects. 
        Critical alert: ${stats.highRisk} projects have been flagged as high risk by our prediction engine. 
        The average confidence score across the portfolio is ${Math.round(stats.avgConfidence * 100)} percent. 
        Total projected delay variance stands at ${stats.totalDelay} days across all active sites. 
        The simulator is ready for resource optimization. End of briefing.`;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setSpeaking(false);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const preferredVoice = pickPreferredVoice();
        if (preferredVoice) utterance.voice = preferredVoice;

        setSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Hero Stats */}
            <section className="app-surface p-8 bg-gradient-to-r from-slate-50 to-blue-50 border-blue-100">
                <div className="flex items-start justify-between">
                    <div>
                        <Typography variant="h4" className="font-bold mb-2 text-slate-900">Predictive Intelligence Dashboard</Typography>
                        <p className="text-slate-600 mb-8 max-w-2xl text-sm leading-relaxed">
                            <strong>Enterprise-level project health simulation</strong>. Our engine analyzes real-time field data, funding utilization, and environmental risk factors.
                            Powered by <span className="font-mono bg-blue-100 text-[#0f5fa8] px-1.5 py-0.5 rounded text-xs font-bold">TensorFlow.js</span>, it executes client-side heuristic regressions to predict
                            unfavorable schedule variances before they manifest.
                        </p>
                    </div>
                    <MuiButton
                        variant="contained"
                        startIcon={speaking ? <StopIcon /> : <VolumeUpIcon />}
                        onClick={handleVoiceBriefing}
                        className={`rounded-2xl font-bold px-6 py-4 shadow-xl transition-all ${speaking ? 'bg-rose-600' : 'bg-[#0f5fa8] hover:bg-[#0c4d8a] shadow-blue-200'}`}
                    >
                        {speaking ? 'Stop Briefing' : 'Voice Briefing'}
                    </MuiButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-1">Portfolio Risk</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-rose-600">{stats?.highRisk ?? 0}</span>
                            <span className="text-sm text-slate-400">Critical</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-1">Avg Confidence</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{((stats?.avgConfidence ?? 0) * 100).toFixed(0)}%</span>
                            <span className="text-sm text-slate-400">Model Reliability</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-1">Cumulative Delay</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-amber-600">{stats?.totalDelay ?? 0}</span>
                            <span className="text-sm text-slate-400">Days Out</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-1">Status</p>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm font-semibold text-slate-700">Real-time Analysis</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Visual Analytics Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1">
                    <PortfolioRadar projects={
                        [...highRiskProjects.slice(0, 2), ...healthyProjects.slice(0, 2)].map(item => ({
                            name: item.project.name,
                            riskLevel: item.pred.riskLevel as 'High' | 'Medium' | 'Low',
                            metrics: {
                                budgetAdherence: Math.max(20, 100 - (item.project.funding?.utilizationPercent || 50)),
                                scheduleVelocity: item.pred.onTrack ? 90 : 40,
                                laborDensity: Math.min(100, (item.project.teamsize || 5) * 5),
                                riskMitigation: item.pred.confidenceScore * 100
                            }
                        }))
                    } />
                </div>

                <section className="xl:col-span-2 app-surface p-6 border-l-4 border-[#0f5fa8] bg-white h-full flex flex-col justify-center">
                    <Typography variant="subtitle1" className="font-bold text-slate-900 mb-2">How it works: Analytic Methodology</Typography>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2 text-enterprise">Algorithm</p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                We leverage <strong>Client-side Neural Heuristics</strong> via TensorFlow.js. This ensures data privacy while maintaining high-performance
                                inference across your infrastructure portfolio.
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2 text-enterprise">Data Points</p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The model ingests <strong>Temporal Exhaustion</strong> (time spent), <strong>Verified Utilization</strong> (on-site work), and
                                <strong>Environmental Risk Weights</strong> to generate the delay variance.
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2 text-enterprise">Confidence Score</p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Calculated based on the delta between expected and actual progress. High variance or missing field reports automatically penalize the confidence metric.
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Risk Variance Table */}
            <section className="app-surface overflow-hidden">
                <div className="px-6 py-5 border-b border-rose-100 bg-rose-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        <Typography variant="h6" className="font-semibold text-slate-800">High Variance & Risk Intervention</Typography>
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded uppercase">Attention Required</span>
                </div>

                {(projectsLoading || analyzing) ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="h-12 w-12 border-4 border-slate-100 border-t-[#0f5fa8] rounded-full animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">Computing predictive heuristics V2...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Project Details</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Timeline Impact</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">AI Reasoning & "How it delays"</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Confidence</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Bottlenecks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {highRiskProjects.length > 0 ? highRiskProjects.map(({ project, pred }) => {
                                    const delay = pred.predictedTotalDays - pred.delayBreakdown.baseTimeline;

                                    return (
                                        <tr key={project.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <p className="font-bold text-slate-900">{project.name}</p>
                                                <p className="text-[11px] text-slate-500 mt-0.5">{project.projectType || 'General Infra'} • {project.location.city}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-lg font-bold ${delay > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                        {delay > 0 ? `+${delay} Days` : 'On Track'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Target: {pred.delayBreakdown.baseTimeline}d</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${pred.riskLevel === 'High' ? 'bg-rose-500' : pred.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${Math.min(100, (pred.delayBreakdown.baseTimeline / pred.predictedTotalDays) * 100)}%` }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 max-w-xs">
                                                <div className={`p-3 rounded-lg border-l-4 ${pred.riskLevel === 'High' ? 'bg-rose-50 border-rose-300' : 'bg-amber-50 border-amber-300'}`}>
                                                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                                                        {pred.delayReasoning}
                                                    </p>
                                                    <MuiButton
                                                        size="small"
                                                        className="mt-2 text-[10px] font-bold"
                                                        onClick={() => {
                                                            setSelectedProject(project);
                                                            setSimData(null);
                                                            setDeltaTeamsize(0);
                                                            setDeltaUtilization(0);
                                                        }}
                                                    >
                                                        Run Simulation
                                                    </MuiButton>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-semibold text-slate-700">{(pred.confidenceScore * 100).toFixed(0)}%</div>
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(i => (
                                                            <div key={i} className={`h-3 w-1 rounded-full ${i <= pred.confidenceScore * 5 ? 'bg-[#0f5fa8]' : 'bg-slate-200'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {pred.bottlenecks.length > 0 ? pred.bottlenecks.map((b, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold border border-rose-200 uppercase tracking-tighter">
                                                            {b}
                                                        </span>
                                                    )) : (
                                                        <span className="text-[10px] text-slate-400 italic">No significant bottlenecks identified</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">No high-risk projects detected in this cycle.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Operational Excellence Table */}
            <section className="app-surface overflow-hidden border-emerald-100">
                <div className="px-6 py-5 border-b border-emerald-100 bg-emerald-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <Typography variant="h6" className="font-semibold text-slate-800">Healthy Projects & Operational Excellence</Typography>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded uppercase">On Track</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Project Details</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Efficiency Insights</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Confidence</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Optimizations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {healthyProjects.length > 0 ? healthyProjects.map(({ project, pred }) => (
                                <tr key={project.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <p className="font-bold text-slate-900">{project.name}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{project.projectType || 'General Infra'} • {project.location.city}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-[10px]">✓</span>
                                            <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Nominal</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 max-w-xs">
                                        <p className="text-[11px] text-slate-600 leading-relaxed italic">
                                            {pred.delayReasoning}
                                        </p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm font-semibold text-slate-700">{(pred.confidenceScore * 100).toFixed(0)}%</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200">
                                                Resource Matched
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">No nominal projects identified. All active sites require variance monitoring.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Simulation Modal */}
            <Modal open={!!selectedProject} onClose={() => setSelectedProject(null)}>
                <Box className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
                    <Typography variant="h5" className="font-bold text-slate-900 mb-2">Intelligence Simulator</Typography>
                    <p className="text-xs text-slate-500 mb-6 font-medium uppercase tracking-wider">Project: {selectedProject?.name}</p>

                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-sm font-bold text-slate-700">Labor Surge / Workforce Delta</label>
                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${deltaTeamsize >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {deltaTeamsize > 0 && '+'}{deltaTeamsize} Laborers
                                </span>
                            </div>
                            <Slider
                                value={deltaTeamsize}
                                min={-10}
                                max={20}
                                step={1}
                                onChange={(_, v) => setDeltaTeamsize(v as number)}
                                className="text-[#0f5fa8]"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-sm font-bold text-slate-700">Efficiency Gain / Material Flow</label>
                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${deltaUtilization >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {deltaUtilization > 0 && '+'}{deltaUtilization}%
                                </span>
                            </div>
                            <Slider
                                value={deltaUtilization}
                                min={-20}
                                max={30}
                                step={5}
                                onChange={(_, v) => setDeltaUtilization(v as number)}
                                className="text-[#0f5fa8]"
                            />
                        </div>

                        <MuiButton
                            fullWidth
                            variant="contained"
                            className="bg-[#0f5fa8] py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-200"
                            onClick={handleSimulate}
                            disabled={simLoading}
                        >
                            {simLoading ? 'Simulating Heuristics...' : 'Generate AI Impact Forecast'}
                        </MuiButton>

                        {simData && (
                            <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Projected Saving</p>
                                        <p className="text-2xl font-bold text-emerald-600">{simData.impact.daysSaved} Days</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">New Risk Level</p>
                                        <p className={`text-2xl font-bold ${simData.simulated.riskLevel === 'High' ? 'text-rose-600' : 'text-amber-600'}`}>
                                            {simData.simulated.riskLevel}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-[10px] text-center text-slate-400 mt-4 italic font-medium">
                                    Confidence Score: {(simData.simulated.confidenceScore * 100).toFixed(0)}% • Model: INFRA-SIM-V4
                                </p>
                            </div>
                        )}
                    </div>
                </Box>
            </Modal>
        </div>
    );
};

export default AiDetailedAnalysis;
