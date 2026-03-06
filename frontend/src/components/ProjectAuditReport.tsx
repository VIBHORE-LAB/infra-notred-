import React from 'react';
import { Typography, Divider } from '@mui/material';
import { Project } from '../hooks/useProjects';
import { formatDate } from '../helpers';

interface ProjectAuditReportProps {
    project: Project;
    milestones: any[];
    updates: any[];
    prediction: any;
    runwayInfo: any;
}

const ProjectAuditReport: React.FC<ProjectAuditReportProps> = ({ project, milestones, updates, prediction, runwayInfo }) => {
    return (
        <div className="bg-white p-12 max-w-[800px] mx-auto border border-slate-200 shadow-2xl print:shadow-none print:border-none print:p-0">
            {/* Report Header */}
            <div className="flex justify-between items-start mb-10">
                <div>
                    <Typography variant="h4" className="font-bold text-slate-900 mb-1">PROJECT AUDIT REPORT</Typography>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">INFRA-INTELLIGENCE PORTAL • OFFICIAL DOCUMENT</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{formatDate(new Date())}</p>
                    <p className="text-[10px] text-slate-500">Report ID: AUDIT-{project.id?.slice(-6).toUpperCase()}</p>
                </div>
            </div>

            <Divider className="mb-8" />

            {/* Project Summary */}
            <section className="mb-10">
                <Typography variant="h6" className="font-bold text-slate-900 mb-4 uppercase tracking-tight text-sm">I. Project Identification</Typography>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Project Name</p>
                        <p className="font-semibold text-slate-800">{project.name}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Location</p>
                        <p className="font-semibold text-slate-800">{project.location?.city}, {project.location?.state}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Start Date</p>
                        <p className="font-semibold text-slate-800">{formatDate(project.timeline?.startDate, 'Not Specified')}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Current Status</p>
                        <p className="font-semibold text-slate-800">{project.status}</p>
                    </div>
                </div>
            </section>

            {/* Predictive Insights */}
            <section className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <Typography variant="h6" className="font-bold text-slate-900 mb-4 uppercase tracking-tight text-sm">II. Predictive Assessment</Typography>
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Risk Level</p>
                        <div className={`text-lg font-bold ${prediction?.riskLevel === 'High' ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {prediction?.riskLevel || 'LOW'} RISK
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Confidence Score</p>
                        <p className="text-lg font-bold text-slate-800">{Math.round((prediction?.confidenceScore || 0) * 100)}%</p>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Reasoning Summary</p>
                    <p className="text-sm text-slate-700 leading-relaxed italic border-l-2 border-slate-200 pl-4">
                        "{prediction?.delayReasoning || 'Project parameters remain within nominal thresholds. No significant schedule variance detected.'}"
                    </p>
                </div>
            </section>

            {/* Financial Status */}
            <section className="mb-10">
                <Typography variant="h6" className="font-bold text-slate-900 mb-4 uppercase tracking-tight text-sm">III. Financial Runway & Allocation</Typography>
                <div className="grid grid-cols-3 gap-4 text-sm mb-6">
                    <div className="p-3 border border-slate-100 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Allocated</p>
                        <p className="font-bold text-slate-800">₹{project.funding?.estimatedBudget?.toLocaleString()}</p>
                    </div>
                    <div className="p-3 border border-slate-100 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Utilization</p>
                        <p className="font-bold text-slate-800">{project.funding?.utilizationPercent}%</p>
                    </div>
                    <div className="p-3 border border-slate-100 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Runway</p>
                        <p className="font-bold text-rose-600">{runwayInfo?.daysLeft || 'N/A'} Days</p>
                    </div>
                </div>
                {runwayInfo?.exhaustedDate && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-center">
                        <p className="text-[10px] font-bold text-rose-700 uppercase">Predicted Exhaustion Date</p>
                        <p className="text-sm font-bold text-rose-800">{formatDate(runwayInfo.exhaustedDate)}</p>
                    </div>
                )}
            </section>

            {/* Recent Milestones */}
            <section className="mb-10">
                <Typography variant="h6" className="font-bold text-slate-900 mb-4 uppercase tracking-tight text-sm">IV. Recent Milestones</Typography>
                <div className="space-y-3">
                    {milestones.slice(0, 3).map((m, i) => (
                        <div key={i} className="flex justify-between items-center text-sm p-2 border-b border-slate-50">
                            <span className="text-slate-700 font-medium">{m.title}</span>
                            <span className="font-bold text-slate-900">{m.progress}%</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Project Updates */}
            <section className="mb-10">
                <Typography variant="h6" className="font-bold text-slate-900 mb-4 uppercase tracking-tight text-sm">V. Recent Project Updates</Typography>
                <div className="space-y-4">
                    {updates.slice(0, 3).map((u, i) => (
                        <div key={i} className="text-sm">
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-slate-800">{u.title}</span>
                                <span className="text-[10px] text-slate-500">{formatDate(u.createdAt)}</span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2">{u.description}</p>
                        </div>
                    ))}
                    {updates.length === 0 && <p className="text-xs text-slate-400 italic">No formal updates recorded for this period.</p>}
                </div>
            </section>

            {/* Footer */}
            <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-end">
                <div className="max-w-[200px]">
                    <div className="h-px bg-slate-300 w-full mb-2" />
                    <p className="text-[10px] text-center text-slate-500 font-bold uppercase">Authorized Signatory</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-medium">Auto-generated by Infra-Intelligence Engine</p>
                    <p className="text-[9px] text-slate-400">© 2026 Infrared Global. Proprietary & Confidential.</p>
                </div>
            </div>
        </div>
    );
};

export default ProjectAuditReport;
