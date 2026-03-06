import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import GISData from '../components/GISData';
import { batchPredictProjects, PredictionResult } from '../services/aiService';
import AiRiskSummaryWidget from '../components/AiRiskSummaryWidget';
import RiskTicker from '../components/RiskTicker';
import instance from '../api/api';

import { useAuth } from '../context/AuthContext';
import { useProjects, Project } from '../hooks/useProjects';

const STATUS_COLORS: Record<string, string> = {
    Planned: 'bg-blue-50 text-blue-700 border-blue-200',
    'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'On Hold': 'bg-rose-50 text-rose-700 border-rose-200',
};

const GEOCODE_CACHE_KEY = 'project_location_geocode_cache_v1';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getGeocodeCache = (): Record<string, { lat: number; lon: number }> => {
    try {
        const raw = localStorage.getItem(GEOCODE_CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const setGeocodeCache = (cache: Record<string, { lat: number; lon: number }>) => {
    try {
        localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
    } catch {
        // Ignore storage failures
    }
};

const geocodeLocation = async (query: string): Promise<{ lat: number; lon: number } | null> => {
    try {
        const params = new URLSearchParams({
            q: query,
            format: 'jsonv2',
            limit: '1',
        });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
            headers: {
                Accept: 'application/json',
            },
        });
        if (!res.ok) return null;
        const data = await res.json();
        const first = Array.isArray(data) ? data[0] : null;
        if (!first?.lat || !first?.lon) return null;
        return { lat: Number(first.lat), lon: Number(first.lon) };
    } catch {
        return null;
    }
};

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { fetchAllProjects, projects, loading: projectsLoading } = useProjects();
    const [allPredictions, setAllPredictions] = useState<Map<string, PredictionResult>>(new Map());
    const [aiLoading, setAiLoading] = useState(false);
    const [projectMarkers, setProjectMarkers] = useState<
        {
            id: string;
            name: string;
            latitude: number;
            longitude: number;
            description: string;
            projectName: string;
            projectDescription: string;
            images: string[];
            riskLevel?: 'Low' | 'Medium' | 'High';
            aiReasoning?: string;
            confidenceScore?: number;
        }[]
    >([]);



    useEffect(() => {
        const init = async () => {
            const list = await fetchAllProjects();
            if (list && list.length > 0) {
                setAiLoading(true);
                const res = await batchPredictProjects(list);
                setAllPredictions(res);
                setAiLoading(false);
            }
        };
        init();
    }, [fetchAllProjects]);

    useEffect(() => {
        const buildProjectMarkers = async () => {
            if (projects.length === 0) {
                setProjectMarkers([]);
                return;
            }

            let reports: any[] = [];
            try {
                const res = await instance.get('/progress-reports/all');
                reports = res.data?.data?.reports ?? [];
            } catch {
                reports = [];
            }

            const latestReportByProject = new Map<string, any>();
            for (const report of reports) {
                const pid = report.projectId;
                if (!pid) continue;
                const existing = latestReportByProject.get(pid);
                const reportTime = new Date(report.createdAt ?? 0).getTime();
                const existingTime = new Date(existing?.createdAt ?? 0).getTime();
                if (!existing || reportTime > existingTime) {
                    latestReportByProject.set(pid, report);
                }
            }

            const cache = getGeocodeCache();
            const markers: {
                id: string;
                name: string;
                latitude: number;
                longitude: number;
                description: string;
                projectName: string;
                projectDescription: string;
                images: string[];
                riskLevel?: 'Low' | 'Medium' | 'High';
                aiReasoning?: string;
                confidenceScore?: number;
            }[] = [];

            for (const project of projects) {
                const latestReport = latestReportByProject.get(project.id);
                let latitude = Number(project.location?.latitude ?? latestReport?.gpsCoordinates?.latitude);
                let longitude = Number(project.location?.longitude ?? latestReport?.gpsCoordinates?.longitude);

                if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                    const query = [project.location?.city, project.location?.state, project.location?.country]
                        .filter(Boolean)
                        .join(', ');
                    if (query) {
                        const cached = cache[query];
                        if (cached) {
                            latitude = cached.lat;
                            longitude = cached.lon;
                        } else {
                            const geo = await geocodeLocation(query);
                            if (geo) {
                                latitude = geo.lat;
                                longitude = geo.lon;
                                cache[query] = geo;
                                await sleep(150);
                            }
                        }
                    }
                }

                if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

                const locationText = [project.location?.city, project.location?.state, project.location?.country]
                    .filter(Boolean)
                    .join(', ');
                const statusText = project.status ? `Status: ${project.status}` : '';
                const projectDescription = [project.description, statusText, locationText].filter(Boolean).join(' • ');

                const prediction = allPredictions.get(project.id);

                markers.push({
                    id: project.id,
                    name: project.name,
                    latitude,
                    longitude,
                    description: project.name,
                    projectName: project.name,
                    projectDescription,
                    images: latestReport?.images?.length ? latestReport.images : (project as any).image ? [(project as any).image] : [],
                    riskLevel: prediction?.riskLevel,
                    aiReasoning: prediction?.delayReasoning,
                    confidenceScore: prediction?.confidenceScore
                });
            }

            setGeocodeCache(cache);
            setProjectMarkers(markers);
        };

        buildProjectMarkers();
    }, [projects, allPredictions]);

    return (
        <div className="space-y-6">
            <section className="app-surface p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <Typography variant="h4" className="font-semibold text-slate-900">
                            Team Overview
                        </Typography>
                        <p className="muted-text mt-2 text-sm">
                            Welcome back, <span className="capitalize font-semibold text-slate-800">{user?.role ?? 'user'}</span>. Monitor delivery speed,
                            fund utilization, and location updates in one place.
                        </p>
                    </div>
                    {user?.role === 'owner' && (
                        <Link
                            to="/projects/create"
                            className="rounded-xl bg-[#0f5fa8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0d528f]"
                        >
                            Create New Project
                        </Link>
                    )}
                </div>
            </section>

            {/* Standalone Feature: AI Risk Ticker */}
            <div className="mb-6">
                <RiskTicker />
            </div>

            <section className="app-surface overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                    <Typography variant="h6" className="font-semibold text-slate-900">Project Portfolio</Typography>
                    <span className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-600">{projects.length} active records</span>
                </div>

                {projectsLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f5fa8]"></div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="px-6 py-10 text-center text-slate-500">
                        <p>No projects available yet.</p>
                        {user?.role === 'owner' && (
                            <Link to="/projects/create" className="text-[#0f5fa8] hover:underline text-sm font-semibold inline-block mt-2">
                                Start with your first project
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {projects.map((project: Project) => (
                            <div key={project.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="font-semibold text-slate-900">{project.name}</span>
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs border font-medium ${STATUS_COLORS[project.status] ?? 'bg-slate-100 border-slate-200 text-slate-700'
                                                }`}
                                        >
                                            {project.status}
                                        </span>
                                        {allPredictions.get(project.id) && (
                                            <span
                                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${allPredictions.get(project.id)?.riskLevel === 'High'
                                                    ? 'bg-rose-100 text-rose-700'
                                                    : allPredictions.get(project.id)?.riskLevel === 'Medium'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                    }`}
                                            >
                                                {allPredictions.get(project.id)?.riskLevel} Risk
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs muted-text">
                                        {project.location?.city}, {project.location?.state} • {project.projectType ?? 'Infrastructure'}
                                    </p>
                                    {project.funding?.estimatedBudget && (
                                        <p className="text-xs text-slate-700">
                                            Budget: ₹{Number(project.funding.estimatedBudget).toLocaleString('en-IN')} • Utilized:{' '}
                                            <span className="font-semibold text-[#0f5fa8]">{project.funding.utilizationPercent ?? 0}%</span>
                                        </p>
                                    )}
                                </div>

                                <Link
                                    to={`/projects/${project.id}`}
                                    className="text-sm px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:border-[#0f5fa8] hover:text-[#0f5fa8]"
                                >
                                    Open
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <section className="app-surface p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <Typography variant="h6" className="font-semibold text-slate-900">GIS Activity Map</Typography>
                        <span className="text-xs text-slate-500">Project locations with hover details</span>
                    </div>
                    <GISData staticMarkers={projectMarkers} />
                </section>

                <AiRiskSummaryWidget
                    projects={projects}
                    predictions={allPredictions}
                    loading={aiLoading}
                />

            </div>
        </div>
    );
};

export default Dashboard;
