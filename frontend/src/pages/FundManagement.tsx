import React, { useMemo } from 'react';
import { Typography } from '@mui/material';
import { useProjects } from '../hooks/useProjects';
import { Link } from 'react-router-dom';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const FundManagement: React.FC = () => {
    const { fetchAllProjects, projects, loading: projectsLoading } = useProjects();

    React.useEffect(() => {
        fetchAllProjects();
    }, [fetchAllProjects]);

    // This is a simplified version; in a real app we'd fetch all summaries in one go
    // For now, we'll display what we have from the projects list and use hooks where possible
    const portfolioStats = useMemo(() => {
        if (!projects || projects.length === 0) return null;

        const totalBudget = projects.reduce((sum, p) => sum + (p.funding?.estimatedBudget || 0), 0);
        const avgUtilization = projects.reduce((sum, p) => sum + (p.funding?.utilizationPercent || 0), 0) / projects.length;

        return {
            totalBudget,
            totalSpent: projects.reduce((sum, p) => sum + ((p.funding?.estimatedBudget || 0) * (p.funding?.utilizationPercent || 0) / 100), 0),
            avgUtilization,
            projectCount: projects.length,
            atRiskCount: projects.filter(p => (p.funding?.utilizationPercent || 0) > 85).length
        };
    }, [projects]);

    return (
        <div className="space-y-8 pb-12">
            {/* Hero Section */}
            <section className="app-surface p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-2xl">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <Typography variant="h4" className="font-bold mb-2">Portfolio Fund Management</Typography>
                        <p className="text-slate-400 text-sm max-w-xl">
                            Strategic financial oversight across all active infrastructure sectors.
                            Monitor capital allocation, spending velocity, and predictive liquidity risks in real-time.
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 grid place-items-center">
                            <TrendingUpIcon />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portfolio Health</p>
                            <p className="text-lg font-bold text-emerald-400 font-mono">NOMINAL</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/5">
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Total Capital</p>
                        <p className="text-2xl font-bold font-mono text-white">₹{portfolioStats?.totalBudget.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/5">
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Total Utilization</p>
                        <p className="text-2xl font-bold font-mono text-blue-400">₹{portfolioStats?.totalSpent.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/5">
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Avg. Burn Rate</p>
                        <p className="text-2xl font-bold font-mono text-amber-400">{Math.round(portfolioStats?.avgUtilization || 0)}%</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/5">
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Liquidity Risk</p>
                        <p className="text-2xl font-bold font-mono text-rose-400">{portfolioStats?.atRiskCount} Projects</p>
                    </div>
                </div>
            </section>

            {/* Project Financials Tracker */}
            <section className="app-surface overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <AccountBalanceWalletIcon className="text-slate-400" />
                        <Typography variant="h6" className="font-semibold text-slate-800">Project Financial Registry</Typography>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded uppercase">{projects.length} Active Budgets</span>
                </div>

                {projectsLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="h-12 w-12 border-4 border-slate-100 border-t-[#0f5fa8] rounded-full animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">Synchronizing ledger data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-6 py-4">Project & Category</th>
                                    <th className="px-6 py-4">Financial Allocation</th>
                                    <th className="px-6 py-4">Utilization</th>
                                    <th className="px-6 py-4">Status & Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {projects.map((project) => {
                                    const util = project.funding?.utilizationPercent || 0;
                                    const budget = project.funding?.estimatedBudget || 0;
                                    const spent = (budget * util) / 100;

                                    return (
                                        <tr key={project.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <p className="font-bold text-slate-900">{project.name}</p>
                                                <p className="text-[11px] text-slate-500 mt-0.5">{project.projectType || 'Infrastructure'} • {project.location.city}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs font-mono">
                                                        <span className="text-slate-400">Spent:</span>
                                                        <span className="text-slate-900 font-bold">₹{spent.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] font-mono border-t border-slate-100 pt-1">
                                                        <span className="text-slate-400">Budget:</span>
                                                        <span className="text-slate-500">₹{budget.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${util > 85 ? 'bg-rose-500' : util > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                            style={{ width: `${util}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-bold font-mono ${util > 85 ? 'text-rose-600' : 'text-slate-700'}`}>{util}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-between">
                                                    {util > 85 ? (
                                                        <div className="flex items-center gap-1.5 text-rose-600">
                                                            <WarningAmberIcon sx={{ fontSize: 14 }} />
                                                            <span className="text-[10px] font-bold uppercase tracking-tighter">Budget Alert</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-emerald-600">
                                                            <SpeedIcon sx={{ fontSize: 14 }} />
                                                            <span className="text-[10px] font-bold uppercase tracking-tighter">Healthy</span>
                                                        </div>
                                                    )}
                                                    <Link
                                                        to={`/projects/${project.id}`}
                                                        className="text-[11px] font-bold text-[#0f5fa8] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
                                                    >
                                                        Details
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default FundManagement;
