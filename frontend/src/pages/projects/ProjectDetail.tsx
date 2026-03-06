import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Modal, Box, Button as MuiButton, MenuItem, Popover } from '@mui/material';
import { useProjects, Project } from '../../hooks/useProjects';
import { useMilestones } from '../../hooks/useMilestones';
import { useFunds } from '../../hooks/useFunds';
import { useFinancialRunway } from '../../hooks/useFinancialRunway';
import { batchPredictProjects } from '../../services/aiService';
import { formatDate } from '../../helpers';
import TextInput from '../../components/TextInput';
import FundTracker from './FundTracker';
import ProjectAuditReport from '../../components/ProjectAuditReport';
import ArticleIcon from '@mui/icons-material/Article';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS: Record<string, string> = {
    planned: 'bg-blue-50 text-blue-700 border-blue-200',
    'in progress': 'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'on hold': 'bg-rose-50 text-rose-700 border-rose-200',
};

const MILESTONE_STATUS_COLORS: Record<string, string> = {
    planned: 'bg-blue-50 text-blue-700 border-blue-200',
    'in progress': 'bg-amber-50 text-amber-700 border-amber-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'on hold': 'bg-rose-50 text-rose-700 border-rose-200',
    on_hold: 'bg-rose-50 text-rose-700 border-rose-200',
};

const UPDATE_TYPE_COLORS: Record<string, string> = {
    General: 'bg-slate-50 text-slate-700 border-slate-200',
    Delay: 'bg-rose-50 text-rose-700 border-rose-200',
    Milestone: 'bg-purple-50 text-purple-700 border-purple-200',
    Budget: 'bg-orange-50 text-orange-700 border-orange-200',
    Completion: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const UPDATE_TYPES = ['General', 'Delay', 'Milestone', 'Budget', 'Completion'];

const ProjectDetail: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { user } = useAuth();
    const { fetchProject, loading: projectLoading, error: projectError } = useProjects();
    const {
        milestones,
        projectUpdates,
        progressReports,
        fetchMilestonesByProject,
        fetchProjectUpdatesByProject,
        fetchReportsByProject,
        createMilestone,
        createProjectUpdate,
        createGalleryReport,
        loading: extrasLoading,
        actionLoading,
        error: actionsError,
    } = useMilestones();
    const { summary, fetchFundSummary } = useFunds();
    const [project, setProject] = useState<Project | null>(null);
    const [prediction, setPrediction] = useState<any>(null);
    const [showAudit, setShowAudit] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [milestoneForm, setMilestoneForm] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        progress: '0',
        status: 'Planned',
    });
    const [updateForm, setUpdateForm] = useState({
        title: '',
        description: '',
        updateType: 'General',
    });
    const [updateAttachments, setUpdateAttachments] = useState<File[]>([]);
    const [galleryForm, setGalleryForm] = useState({
        latitude: '',
        longitude: '',
        description: '',
    });
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [milestoneAnchorEl, setMilestoneAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [updateAnchorEl, setUpdateAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [galleryAnchorEl, setGalleryAnchorEl] = useState<HTMLButtonElement | null>(null);

    const runwayInfo = useFinancialRunway(summary, project?.timeline?.startDate);
    const canManage = ['owner', 'admin'].includes((user?.role ?? '').toLowerCase());

    useEffect(() => {
        if (projectId) {
            fetchProject(projectId).then(async (p) => {
                if (p) {
                    setProject(p);
                    const predRes = await batchPredictProjects([p]);
                    setPrediction(predRes.get(p.id));
                }
            });
            fetchMilestonesByProject(projectId);
            fetchProjectUpdatesByProject(projectId);
            fetchReportsByProject(projectId);
            fetchFundSummary(projectId);
        }
    }, [projectId, fetchProject, fetchMilestonesByProject, fetchProjectUpdatesByProject, fetchReportsByProject, fetchFundSummary]);

    if (projectLoading) {
        return (
            <div className="app-surface p-10 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0f5fa8]" />
            </div>
        );
    }

    if (projectError) {
        return <div className="app-surface p-6 text-red-700 border-red-200">{projectError}</div>;
    }

    if (!project) {
        return <div className="app-surface p-6 text-slate-500">No project found for this identifier.</div>;
    }

    const normalizedStatus = project.status?.toLowerCase().replace('_', ' ');

    const overallProgress = milestones.length > 0
        ? Math.round(milestones.reduce((sum, m) => sum + (m.progress ?? 0), 0) / milestones.length)
        : 0;

    const handleCreateMilestone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId || !milestoneForm.title.trim()) return;

        const created = await createMilestone({
            projectId,
            title: milestoneForm.title.trim(),
            description: milestoneForm.description.trim(),
            startDate: milestoneForm.startDate,
            endDate: milestoneForm.endDate,
            progress: Number(milestoneForm.progress || 0),
            status: milestoneForm.status,
        });

        if (created) {
            setSuccessMessage('Milestone added successfully.');
            setMilestoneForm({
                title: '',
                description: '',
                startDate: '',
                endDate: '',
                progress: '0',
                status: 'Planned',
            });
            fetchMilestonesByProject(projectId);
            setMilestoneAnchorEl(null);
        }
    };

    const handleCreateProjectUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId || !updateForm.title.trim() || !updateForm.description.trim()) return;

        const created = await createProjectUpdate({
            projectId,
            title: updateForm.title.trim(),
            description: updateForm.description.trim(),
            updateType: updateForm.updateType,
            attachments: updateAttachments,
        });

        if (created) {
            setSuccessMessage('Project update posted successfully.');
            setUpdateForm({
                title: '',
                description: '',
                updateType: 'General',
            });
            setUpdateAttachments([]);
            fetchProjectUpdatesByProject(projectId);
            setUpdateAnchorEl(null);
        }
    };

    const handleCreateGalleryUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId || galleryImages.length === 0 || !galleryForm.latitude || !galleryForm.longitude) return;

        const uploaded = await createGalleryReport({
            projectId,
            latitude: galleryForm.latitude,
            longitude: galleryForm.longitude,
            description: galleryForm.description.trim(),
            images: galleryImages,
        });

        if (uploaded) {
            setSuccessMessage('Site gallery updated successfully.');
            setGalleryForm({
                latitude: '',
                longitude: '',
                description: '',
            });
            setGalleryImages([]);
            fetchReportsByProject(projectId);
            setGalleryAnchorEl(null);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto py-6">
            {successMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    {successMessage}
                </div>
            )}
            {actionsError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {actionsError}
                </div>
            )}
            <section className="app-surface p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[300px]">
                        <Typography variant="h4" className="font-semibold text-slate-900">
                            {project.name}
                        </Typography>
                        <p className="text-sm muted-text mt-2 max-w-3xl">{project.description || 'No project description provided.'}</p>
                    </div>
                    <div className="text-right">
                        <span
                            className={`px-3 py-1 rounded-full text-sm border font-medium ${STATUS_COLORS[normalizedStatus] ?? 'bg-slate-100 border-slate-200 text-slate-700'
                                }`}
                        >
                            {project.status}
                        </span>
                    </div>
                </div>

                <div className="flex gap-4 mt-6">
                    <MuiButton
                        variant="outlined"
                        startIcon={<ArticleIcon />}
                        onClick={() => setShowAudit(true)}
                        className="rounded-xl border-slate-200 text-slate-700 font-bold px-5 py-2.5 hover:bg-slate-50 transition-all uppercase text-xs tracking-wider"
                    >
                        View Audit Report
                    </MuiButton>
                    <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Security Cleared</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-6">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                        <p className="text-xs text-slate-500">Type</p>
                        <p className="font-semibold text-slate-800">{project.projectType ?? 'Infrastructure'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                        <p className="text-xs text-slate-500">Team Size</p>
                        <p className="font-semibold text-slate-800">{project.teamsize} members</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                        <p className="text-xs text-slate-500">Location</p>
                        <p className="font-semibold text-slate-800">{project.location?.city}, {project.location?.state}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                        <p className="text-xs text-slate-500">Start</p>
                        <p className="font-semibold text-slate-800">{formatDate(project.timeline?.startDate)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                        <p className="text-xs text-slate-500">End</p>
                        <p className="font-semibold text-slate-800">{formatDate(project.timeline?.endDate)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                        <p className="text-xs text-slate-500">Deadline</p>
                        <p className="font-semibold text-slate-800">{formatDate(project.timeline?.deadline)}</p>
                    </div>
                </div>

                {milestones.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                            <span className="font-medium">OVERALL COMPLETION</span>
                            <span className="font-bold text-slate-900">{overallProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                            <div
                                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-700 shadow-sm"
                                style={{ width: `${overallProgress}%` }}
                            />
                        </div>
                    </div>
                )}
            </section>

            {/* Funds Table */}
            {projectId && <FundTracker projectId={projectId} estimatedBudget={project.funding?.estimatedBudget} startDate={project.timeline?.startDate} />}

            {/* Milestones and Updates side by side on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Milestones Section */}
                <section className="app-surface p-6">
                    <div className="flex items-center justify-between mb-6">
                        <Typography variant="h6" className="font-semibold text-slate-900 flex items-center gap-2">
                            🎯 Milestones
                        </Typography>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                {milestones.length} ITEMS
                            </span>
                            {canManage && (
                                <MuiButton
                                    size="small"
                                    variant="contained"
                                    onClick={(e) => setMilestoneAnchorEl(e.currentTarget)}
                                    className="bg-indigo-700 hover:bg-indigo-800 rounded-lg normal-case"
                                >
                                    Add Milestone
                                </MuiButton>
                            )}
                        </div>
                    </div>

                    {extrasLoading ? (
                        <div className="flex justify-center py-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                        </div>
                    ) : milestones.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-50 rounded-xl">
                            <p className="text-sm">No milestones tracked for this project.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {milestones.map((m) => (
                                <div key={m.id} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-100 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-semibold text-slate-800 text-sm">{m.title}</h4>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors border ${MILESTONE_STATUS_COLORS[m.status?.toLowerCase().replace('_', ' ')] ?? 'bg-slate-50 text-slate-600'
                                            }`}>
                                            {m.status?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    {m.description && <p className="text-xs text-slate-500 mb-3">{m.description}</p>}
                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-medium">
                                        <span>PROGRESS</span>
                                        <span>{m.progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                                        <div
                                            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                                            style={{ width: `${m.progress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                                        <span>{formatDate(m.startDate, 'No start date')}</span>
                                        <span>{formatDate(m.endDate, 'No end date')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Project Updates Section */}
                <section className="app-surface p-6">
                    <div className="flex items-center justify-between mb-6">
                        <Typography variant="h6" className="font-semibold text-slate-900 flex items-center gap-2">
                            📋 Project Updates
                        </Typography>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                {projectUpdates.length} LOGS
                            </span>
                            {canManage && (
                                <MuiButton
                                    size="small"
                                    variant="contained"
                                    onClick={(e) => setUpdateAnchorEl(e.currentTarget)}
                                    className="bg-indigo-700 hover:bg-indigo-800 rounded-lg normal-case"
                                >
                                    Post Update
                                </MuiButton>
                            )}
                        </div>
                    </div>

                    {projectUpdates.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-50 rounded-xl">
                            <p className="text-sm">No project updates have been posted.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {projectUpdates.map((u) => (
                                <div key={u.id} className="relative pl-6 pb-2 border-l-2 border-slate-100 last:border-0 last:pb-0">
                                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-500 shadow-sm" />
                                    <div className="mb-1 flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-slate-800">{u.title}</h4>
                                        <span className="text-[10px] text-slate-400">
                                            {formatDate(u.createdAt, '')}
                                        </span>
                                    </div>
                                    <div className="mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${UPDATE_TYPE_COLORS[u.updateType] ?? 'bg-slate-50 text-slate-600'
                                            }`}>
                                            {u.updateType}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed mb-2">{u.description}</p>
                                    {u.attachments && u.attachments.length > 0 && (
                                        <div className="flex gap-2 flex-wrap pb-2 mt-3">
                                            {u.attachments.map((url, i) => (
                                                <div key={i} className="relative group">
                                                    <img
                                                        src={url}
                                                        alt={`attachment-${i}`}
                                                        className="w-24 h-24 object-cover rounded-lg border border-slate-200 shadow-sm"
                                                    />
                                                    <a
                                                        href={url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                                                    >
                                                        View
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Site Photos Section */}
            <section className="app-surface p-6">
                <div className="flex items-center justify-between mb-6">
                    <Typography variant="h6" className="font-semibold text-slate-900 flex items-center gap-2">
                        📸 Site Gallery (Field Reports)
                    </Typography>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                            {progressReports.reduce((acc, r) => acc + (r.images?.length || 0), 0)} PHOTOS
                        </span>
                        {canManage && (
                            <MuiButton
                                size="small"
                                variant="contained"
                                onClick={(e) => setGalleryAnchorEl(e.currentTarget)}
                                className="bg-indigo-700 hover:bg-indigo-800 rounded-lg normal-case"
                            >
                                Upload Photos
                            </MuiButton>
                        )}
                    </div>
                </div>

                {progressReports.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-50 rounded-xl">
                        <p className="text-sm">No GPS-tagged field reports available.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {progressReports.map(report =>
                            report.images?.map((img, idx) => (
                                <div key={`${report.id}-${idx}`} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
                                    <img
                                        src={img}
                                        alt="field report"
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                                        <p className="text-[10px] text-white font-medium truncate">{report.description}</p>
                                        <p className="text-[8px] text-white/80">{formatDate(report.timestamp)}</p>
                                    </div>
                                    <a
                                        href={img}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="absolute inset-0 z-10"
                                        title="View full size"
                                    />
                                </div>
                            ))
                        )}
                    </div>
                )}
            </section>

            <Popover
                open={Boolean(milestoneAnchorEl)}
                anchorEl={milestoneAnchorEl}
                onClose={() => setMilestoneAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
                <form onSubmit={handleCreateMilestone} className="w-[460px] max-w-[92vw] min-h-[520px] max-h-[88vh] overflow-y-auto p-5 gap-2 space-y-4">
                    <p className="text-sm font-semibold text-slate-700">Add Milestone</p>
                    <TextInput
                        label="Title"
                        name="milestoneTitle"
                        value={milestoneForm.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMilestoneForm((prev) => ({ ...prev, title: e.target.value }))}
                        required
                    />
                    <TextInput
                        label="Description"
                        name="milestoneDescription"
                        value={milestoneForm.description}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMilestoneForm((prev) => ({ ...prev, description: e.target.value }))}
                        multiline
                        minRows={2}
                    />
                    <div className="pt-5 space-y-3">
                        <TextInput
                            label="Start Date"
                            name="milestoneStartDate"
                            type="date"
                            value={milestoneForm.startDate}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMilestoneForm((prev) => ({ ...prev, startDate: e.target.value }))}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextInput
                            label="End Date"
                            name="milestoneEndDate"
                            type="date"
                            value={milestoneForm.endDate}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMilestoneForm((prev) => ({ ...prev, endDate: e.target.value }))}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextInput
                            label="Progress (%)"
                            name="milestoneProgress"
                            type="number"
                            value={milestoneForm.progress}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMilestoneForm((prev) => ({ ...prev, progress: e.target.value }))}
                            inputProps={{ min: 0, max: 100 }}
                        />
                    </div>
                    <TextInput
                        label="Status"
                        name="milestoneStatus"
                        value={milestoneForm.status}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMilestoneForm((prev) => ({ ...prev, status: e.target.value }))}
                        select
                    >
                        <MenuItem value="Planned">Planned</MenuItem>
                        <MenuItem value="In Progress">In Progress</MenuItem>
                        <MenuItem value="Completed">Completed</MenuItem>
                    </TextInput>
                    <MuiButton type="submit" variant="contained" disabled={actionLoading} className="bg-indigo-700 hover:bg-indigo-800 rounded-lg normal-case">
                        {actionLoading ? 'Saving...' : 'Add Milestone'}
                    </MuiButton>
                </form>
            </Popover>

            <Popover
                open={Boolean(updateAnchorEl)}
                anchorEl={updateAnchorEl}
                onClose={() => setUpdateAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
                <form onSubmit={handleCreateProjectUpdate} className="w-[460px] max-w-[92vw] min-h-[520px] max-h-[88vh] overflow-y-auto p-5 space-y-4">
                    <p className="text-sm font-semibold text-slate-700">Post Update</p>
                    <TextInput
                        label="Title"
                        name="updateTitle"
                        value={updateForm.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUpdateForm((prev) => ({ ...prev, title: e.target.value }))}
                        required
                    />
                    <TextInput
                        label="Update Type"
                        name="updateType"
                        value={updateForm.updateType}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUpdateForm((prev) => ({ ...prev, updateType: e.target.value }))}
                        select
                    >
                        {UPDATE_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </TextInput>
                    <TextInput
                        label="Description"
                        name="updateDescription"
                        value={updateForm.description}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUpdateForm((prev) => ({ ...prev, description: e.target.value }))}
                        multiline
                        minRows={3}
                        required
                    />
                    <div className="space-y-1">
                        <p className="text-xs text-slate-500">Attachments (optional)</p>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setUpdateAttachments(Array.from(e.target.files ?? []))}
                            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-indigo-700 file:font-semibold hover:file:bg-indigo-100"
                        />
                    </div>
                    <MuiButton type="submit" variant="contained" disabled={actionLoading} className="bg-indigo-700 hover:bg-indigo-800 rounded-lg normal-case">
                        {actionLoading ? 'Posting...' : 'Post Update'}
                    </MuiButton>
                </form>
            </Popover>

            <Popover
                open={Boolean(galleryAnchorEl)}
                anchorEl={galleryAnchorEl}
                onClose={() => setGalleryAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
                <form onSubmit={handleCreateGalleryUpload} className="w-[460px] max-w-[92vw] min-h-[520px] max-h-[88vh] overflow-y-auto p-5 space-y-4">
                    <p className="text-sm font-semibold text-slate-700">Upload Site Photos</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <TextInput
                            label="Latitude"
                            name="galleryLatitude"
                            value={galleryForm.latitude}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGalleryForm((prev) => ({ ...prev, latitude: e.target.value }))}
                            required
                        />
                        <TextInput
                            label="Longitude"
                            name="galleryLongitude"
                            value={galleryForm.longitude}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGalleryForm((prev) => ({ ...prev, longitude: e.target.value }))}
                            required
                        />
                    </div>
                    <TextInput
                        label="Caption / Description"
                        name="galleryDescription"
                        value={galleryForm.description}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGalleryForm((prev) => ({ ...prev, description: e.target.value }))}
                        multiline
                        minRows={2}
                    />
                    <div className="space-y-1">
                        <p className="text-xs text-slate-500">Photos</p>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setGalleryImages(Array.from(e.target.files ?? []))}
                            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-indigo-700 file:font-semibold hover:file:bg-indigo-100"
                            required
                        />
                    </div>
                    <MuiButton type="submit" variant="contained" disabled={actionLoading} className="bg-indigo-700 hover:bg-indigo-800 rounded-lg normal-case">
                        {actionLoading ? 'Uploading...' : 'Upload Photos'}
                    </MuiButton>
                </form>
            </Popover>

            {/* Audit Report Modal */}
            <Modal open={showAudit} onClose={() => setShowAudit(false)} className="flex items-center justify-center p-4">
                <Box className="relative w-full max-w-[850px] max-h-[90vh] overflow-y-auto bg-slate-100 rounded-3xl p-4 shadow-2xl focus:outline-none">
                    <div className="sticky top-0 right-0 z-50 flex justify-end gap-2 mb-4 pointer-events-none">
                        <MuiButton
                            variant="contained"
                            startIcon={<PrintIcon />}
                            onClick={() => window.print()}
                            className="bg-slate-900 pointer-events-auto rounded-xl shadow-lg"
                        >
                            Print Report
                        </MuiButton>
                        <MuiButton
                            variant="contained"
                            onClick={() => setShowAudit(false)}
                            className="bg-white text-slate-900 hover:bg-slate-100 pointer-events-auto rounded-xl shadow-lg min-w-10 px-0"
                        >
                            <CloseIcon />
                        </MuiButton>
                    </div>
                    {project && (
                        <ProjectAuditReport
                            project={project}
                            milestones={milestones}
                            updates={projectUpdates}
                            prediction={prediction}
                            runwayInfo={runwayInfo}
                        />
                    )}
                </Box>
            </Modal>
        </div>
    );
};

export default ProjectDetail;
