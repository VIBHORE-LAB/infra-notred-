import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  CloudSun,
  CirclePlus,
  Download,
  FileArchive,
  FileImage,
  FileText,
  Flag,
  FolderOpenDot,
  Gavel,
  Hammer,
  ImagePlus,
  Landmark,
  MapPinned,
  Milestone,
  MountainSnow,
  PencilLine,
  Printer,
  ShieldCheck,
  Trash2,
  Trees,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ActivityFeed from '@/components/ActivityFeed';
import GISData from '@/components/GISData';
import ProjectAuditReport from '@/components/ProjectAuditReport';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/helpers';
import { useFinancialRunway } from '@/hooks/useFinancialRunway';
import { useFunds } from '@/hooks/useFunds';
import { useMilestones } from '@/hooks/useMilestones';
import { useProjects, Project } from '@/hooks/useProjects';
import {
  MilestoneAnalytics,
  TimelineEvent,
  useProjectWorkspace,
} from '@/hooks/useProjectWorkspace';
import { batchPredictProjects, PredictionResult } from '@/services/aiService';
import FundTracker from './FundTracker';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  formatCurrency,
  riskToneClass,
  statusToneClass,
  updateToneClass,
} from '@/lib/presentation';

const UPDATE_TYPES = ['General', 'Delay', 'Milestone', 'Budget', 'Completion'];
const PRIORITY_OPTIONS = ['Critical', 'Urgent', 'Normal'];
const DEFAULT_TIMELINE_TYPES = [
  'Milestone',
  'Inspection',
  'Tender',
  'Groundbreaking',
  'Completion',
  'Survey',
  'Environmental',
  'Legal',
  'Other',
];

const priorityToneClass = (priority?: string) => {
  switch ((priority ?? '').toLowerCase()) {
    case 'critical':
      return 'status-danger';
    case 'urgent':
      return 'status-progress';
    default:
      return 'status-success';
  }
};

const issueSeverityToneClass = (severity?: string) => {
  switch ((severity ?? '').toLowerCase()) {
    case 'critical':
      return 'status-danger';
    case 'high':
      return 'status-progress';
    case 'medium':
      return 'border-[hsl(var(--status-warning))]/15 bg-[hsl(var(--status-warning-soft))] text-[hsl(var(--status-warning))]';
    default:
      return 'status-success';
  }
};

const issueStatusToneClass = (status?: string) => {
  switch ((status ?? '').toLowerCase()) {
    case 'critical':
      return 'status-danger';
    case 'in progress':
      return 'status-progress';
    case 'resolved':
      return 'status-success';
    default:
      return 'status-planned';
  }
};

const chartColorForStatus = (status?: string) => {
  switch ((status ?? '').toLowerCase()) {
    case 'completed':
      return 'hsl(var(--status-success))';
    case 'planned':
      return 'hsl(var(--primary))';
    case 'in progress':
    case 'in_progress':
      return 'hsl(var(--status-warning))';
    case 'on hold':
    case 'on_hold':
      return 'hsl(var(--status-danger))';
    default:
      return 'hsl(var(--muted-foreground))';
  }
};

const eventTypeIcon = (type?: string) => {
  switch ((type ?? '').toLowerCase()) {
    case 'milestone':
      return <Milestone className="h-4 w-4" />;
    case 'inspection':
      return <ShieldCheck className="h-4 w-4" />;
    case 'tender':
      return <Landmark className="h-4 w-4" />;
    case 'groundbreaking':
      return <Hammer className="h-4 w-4" />;
    case 'completion':
      return <Flag className="h-4 w-4" />;
    case 'survey':
      return <MapPinned className="h-4 w-4" />;
    case 'environmental':
      return <Trees className="h-4 w-4" />;
    case 'legal':
      return <Gavel className="h-4 w-4" />;
    default:
      return <MountainSnow className="h-4 w-4" />;
  }
};

const fileIcon = (fileType?: string) => {
  const normalized = (fileType ?? '').toLowerCase();
  if (normalized.startsWith('image/')) return <FileImage className="h-4 w-4" />;
  if (normalized.includes('zip') || normalized.includes('rar')) return <FileArchive className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
};

const formatFileSize = (bytes?: number) => {
  const value = Number(bytes ?? 0);
  if (!value) return '0 B';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const signoffIcon = (type?: string) => {
  switch ((type ?? '').toLowerCase()) {
    case 'phase completion':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'inspection passed':
      return <ClipboardCheck className="h-4 w-4" />;
    case 'budget approval':
      return <Landmark className="h-4 w-4" />;
    default:
      return <ShieldCheck className="h-4 w-4" />;
  }
};

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    fetchProject,
    fetchAvailableTags,
    addTags,
    removeTag,
    availableTags,
    loading: projectLoading,
    error: projectError,
  } = useProjects();
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
  const {
    announcements,
    documents,
    timelineEvents,
    milestoneAnalytics,
    issuesByProject,
    issueStatsByProject,
    issueMetaByProject,
    siteConditionsByProject,
    siteConditionSummaryByProject,
    signoffsByProject,
    signoffMetaByProject,
    loading: workspaceLoading,
    error: workspaceError,
    fetchAnnouncements,
    createAnnouncement,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    fetchTimeline,
    createTimelineEvent,
    deleteTimelineEvent,
    fetchMilestoneAnalytics,
    fetchIssues,
    createIssue,
    updateIssueStatus,
    fetchSiteConditions,
    createSiteCondition,
    fetchSignoffs,
    createSignoff,
  } = useProjectWorkspace();

  const [project, setProject] = useState<Project | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [projectTags, setProjectTags] = useState<string[]>([]);
  const [selectedTagOption, setSelectedTagOption] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [validEventTypes, setValidEventTypes] = useState<string[]>(DEFAULT_TIMELINE_TYPES);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentTags, setDocumentTags] = useState('');
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    body: '',
    priority: 'Normal',
  });
  const [issueFilters, setIssueFilters] = useState({
    severity: 'all',
    status: 'all',
    issueType: 'all',
  });
  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    severity: 'Medium',
    issueType: 'Other',
    location: '',
  });
  const [issueUpdateDrafts, setIssueUpdateDrafts] = useState<
    Record<string, { status: string; assignedTo: string; resolutionNote: string }>
  >({});
  const [siteLogFilters, setSiteLogFilters] = useState({ from: '', to: '' });
  const [siteLogForm, setSiteLogForm] = useState({
    date: '',
    weather: 'Sunny',
    temperatureCelsius: '',
    workersPresent: '',
    machinesOperational: '',
    workStatus: 'Normal',
    delayReason: '',
    safetyIncidents: '0',
    notes: '',
  });
  const [signoffForm, setSignoffForm] = useState({
    signoffType: 'Phase Completion',
    title: '',
    remarks: '',
    isPublic: true,
    attachmentUrl: '',
  });
  const [timelineForm, setTimelineForm] = useState({
    title: '',
    eventType: 'Milestone',
    eventDate: '',
    description: '',
  });
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

  const runwayInfo = useFinancialRunway(summary, project?.timeline?.startDate);
  const canManage = ['owner', 'admin'].includes((user?.role ?? '').toLowerCase());

  useEffect(() => {
    if (!projectId) return;

    const init = async () => {
      const fetchedProject = await fetchProject(projectId);
      await fetchAvailableTags();
      setProject(fetchedProject);
      setProjectTags(fetchedProject?.tags ?? []);

      if (fetchedProject) {
        const predictionResponse = await batchPredictProjects([fetchedProject]);
        setPrediction(predictionResponse.get(fetchedProject.id) || null);
      } else {
        setPrediction(null);
      }

      const timelineResponse = await fetchTimeline(projectId);
      if (timelineResponse.validEventTypes.length > 0) {
        setValidEventTypes(timelineResponse.validEventTypes);
        setTimelineForm((current) => ({
          ...current,
          eventType: timelineResponse.validEventTypes[0],
        }));
      }
    };

    void init();
    void fetchMilestonesByProject(projectId);
    void fetchProjectUpdatesByProject(projectId);
    void fetchReportsByProject(projectId);
    void fetchFundSummary(projectId);
    void fetchAnnouncements(projectId);
    void fetchDocuments(projectId);
    void fetchMilestoneAnalytics(projectId);
    void fetchIssues(projectId);
    void fetchSiteConditions(projectId);
    void fetchSignoffs(projectId);
  }, [
    fetchAnnouncements,
    fetchAvailableTags,
    fetchDocuments,
    fetchFundSummary,
    fetchIssues,
    fetchMilestoneAnalytics,
    fetchMilestonesByProject,
    fetchProject,
    fetchProjectUpdatesByProject,
    fetchReportsByProject,
    fetchSignoffs,
    fetchSiteConditions,
    fetchTimeline,
    projectId,
  ]);

  useEffect(() => {
    setProjectTags(project?.tags ?? []);
  }, [project?.tags]);

  const overallProgress = useMemo(() => {
    if (milestones.length === 0) return 0;
    const total = milestones.reduce((sum, milestone) => sum + (milestone.progress ?? 0), 0);
    return Math.round(total / milestones.length);
  }, [milestones]);

  const totalPhotos = useMemo(
    () => progressReports.reduce((count, report) => count + (report.images?.length || 0), 0),
    [progressReports]
  );

  const projectLocation = [project?.location?.city, project?.location?.state, project?.location?.country]
    .filter(Boolean)
    .join(', ');

  const documentList = projectId ? documents[projectId] ?? [] : [];
  const announcementList = projectId ? announcements[projectId] ?? [] : [];
  const timelineList = projectId ? timelineEvents[projectId] ?? [] : [];
  const issueList = projectId ? issuesByProject[projectId] ?? [] : [];
  const issueStats = projectId
    ? issueStatsByProject[projectId] ?? { total: 0, open: 0, critical: 0, resolved: 0 }
    : { total: 0, open: 0, critical: 0, resolved: 0 };
  const issueMeta = projectId
    ? issueMetaByProject[projectId] ?? { validSeverities: [], validStatuses: [], validTypes: [] }
    : { validSeverities: [], validStatuses: [], validTypes: [] };
  const siteLogs = projectId ? siteConditionsByProject[projectId] ?? [] : [];
  const siteSummaryMeta = projectId
    ? siteConditionSummaryByProject[projectId] ?? {
        summary: {
          totalDaysLogged: 0,
          totalWorkersDeployed: 0,
          totalSafetyIncidents: 0,
          haltedDays: 0,
          delayedDays: 0,
          weatherFrequency: {},
        },
        validWeather: [],
        validWorkStatuses: [],
      }
    : {
        summary: {
          totalDaysLogged: 0,
          totalWorkersDeployed: 0,
          totalSafetyIncidents: 0,
          haltedDays: 0,
          delayedDays: 0,
          weatherFrequency: {},
        },
        validWeather: [],
        validWorkStatuses: [],
      };
  const signoffList = projectId ? signoffsByProject[projectId] ?? [] : [];
  const signoffTypes = projectId ? signoffMetaByProject[projectId] ?? [] : [];
  const analytics: MilestoneAnalytics | undefined = projectId ? milestoneAnalytics[projectId] : undefined;

  const statusBreakdownData = useMemo(
    () =>
      Object.entries(analytics?.statusBreakdown ?? {}).map(([label, value]) => ({
        label,
        value,
        fill: chartColorForStatus(label),
      })),
    [analytics?.statusBreakdown]
  );

  const weatherFrequencyData = useMemo(
    () =>
      Object.entries(siteSummaryMeta.summary.weatherFrequency ?? {}).map(([name, value]) => ({
        name,
        value,
      })),
    [siteSummaryMeta.summary.weatherFrequency]
  );

  const resetMilestoneForm = () =>
    setMilestoneForm({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      progress: '0',
      status: 'Planned',
    });

  const resetUpdateForm = () => {
    setUpdateForm({
      title: '',
      description: '',
      updateType: 'General',
    });
    setUpdateAttachments([]);
  };

  const resetGalleryForm = () => {
    setGalleryForm({
      latitude: '',
      longitude: '',
      description: '',
    });
    setGalleryImages([]);
  };

  const handleCreateMilestone = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectId) return;
    if (!milestoneForm.title.trim()) {
      toast.error('Add a milestone title first.');
      return;
    }

    const result = await createMilestone({
      projectId,
      title: milestoneForm.title.trim(),
      description: milestoneForm.description.trim(),
      startDate: milestoneForm.startDate,
      endDate: milestoneForm.endDate,
      progress: Number(milestoneForm.progress || 0),
      status: milestoneForm.status,
    });

    if (!result) {
      toast.error('Unable to add the milestone.');
      return;
    }

    toast.success('Milestone added.');
    resetMilestoneForm();
    setMilestoneDialogOpen(false);
    await fetchMilestonesByProject(projectId);
    await fetchMilestoneAnalytics(projectId);
  };

  const handleCreateProjectUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectId) return;
    if (!updateForm.title.trim() || !updateForm.description.trim()) {
      toast.error('Add a title and update summary first.');
      return;
    }

    const result = await createProjectUpdate({
      projectId,
      title: updateForm.title.trim(),
      description: updateForm.description.trim(),
      updateType: updateForm.updateType,
      attachments: updateAttachments,
    });

    if (!result) {
      toast.error('Unable to post the update.');
      return;
    }

    toast.success('Project update posted.');
    resetUpdateForm();
    setUpdateDialogOpen(false);
    await fetchProjectUpdatesByProject(projectId);
  };

  const handleCreateGalleryUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectId) return;
    if (!galleryForm.latitude || !galleryForm.longitude || galleryImages.length === 0) {
      toast.error('Add coordinates and at least one image.');
      return;
    }

    const result = await createGalleryReport({
      projectId,
      latitude: galleryForm.latitude,
      longitude: galleryForm.longitude,
      description: galleryForm.description.trim(),
      images: galleryImages,
    });

    if (!result) {
      toast.error('Unable to upload the gallery images.');
      return;
    }

    toast.success('Site photos uploaded.');
    resetGalleryForm();
    setGalleryDialogOpen(false);
    await fetchReportsByProject(projectId);
  };

  const handleAddTags = async () => {
    if (!projectId) return;
    const tags = [selectedTagOption, ...tagInput.split(',')]
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
    const uniqueTags = Array.from(new Set(tags));

    if (uniqueTags.length === 0) {
      toast.error('Add at least one tag.');
      return;
    }

    const updatedTags = await addTags(projectId, uniqueTags);
    if (!updatedTags) {
      toast.error('Unable to add tags.');
      return;
    }

    setProjectTags(updatedTags);
    setProject((current) => (current ? { ...current, tags: updatedTags } : current));
    await fetchAvailableTags();
    setSelectedTagOption('');
    setTagInput('');
    toast.success('Tags updated.');
  };

  const handleRemoveTag = async (tag: string) => {
    if (!projectId) return;
    const updatedTags = await removeTag(projectId, tag);
    if (!updatedTags) {
      toast.error('Unable to remove the tag.');
      return;
    }

    setProjectTags(updatedTags);
    setProject((current) => (current ? { ...current, tags: updatedTags } : current));
    toast.success('Tag removed.');
  };

  const handleCreateAnnouncement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectId) return;
    if (!announcementForm.title.trim() || !announcementForm.body.trim()) {
      toast.error('Add a title and announcement body.');
      return;
    }

    const result = await createAnnouncement({
      projectId,
      title: announcementForm.title.trim(),
      body: announcementForm.body.trim(),
      priority: announcementForm.priority,
    });

    if (!result) {
      toast.error('Unable to post the announcement.');
      return;
    }

    setAnnouncementForm({ title: '', body: '', priority: 'Normal' });
    toast.success('Announcement posted.');
  };

  const handleUploadDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectId || !documentFile) {
      toast.error('Choose a file to upload.');
      return;
    }

    const result = await uploadDocument({
      projectId,
      file: documentFile,
      tags: documentTags.trim(),
    });

    if (!result) {
      toast.error('Unable to upload the file.');
      return;
    }

    setDocumentFile(null);
    setDocumentTags('');
    const input = document.getElementById('project-document-input') as HTMLInputElement | null;
    if (input) input.value = '';
    toast.success('File uploaded.');
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!projectId) return;
    const result = await deleteDocument(projectId, documentId);
    if (!result) {
      toast.error('Unable to delete the file.');
      return;
    }
    toast.success('File removed.');
  };

  const handleCreateTimelineEvent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectId) return;
    if (!timelineForm.title.trim() || !timelineForm.eventDate) {
      toast.error('Add a title and date for the timeline event.');
      return;
    }

    const result = await createTimelineEvent({
      projectId,
      title: timelineForm.title.trim(),
      eventType: timelineForm.eventType,
      eventDate: timelineForm.eventDate,
      description: timelineForm.description.trim(),
    });

    if (!result) {
      toast.error('Unable to add the timeline event.');
      return;
    }

    if (result.validEventTypes.length > 0) {
      setValidEventTypes(result.validEventTypes);
    }
    setTimelineForm({
      title: '',
      eventType: result.validEventTypes[0] ?? validEventTypes[0] ?? 'Milestone',
      eventDate: '',
      description: '',
    });
    toast.success('Timeline event added.');
  };

  const handleDeleteTimelineEvent = async (eventId: string) => {
    if (!projectId) return;
    const result = await deleteTimelineEvent(projectId, eventId);
    if (!result) {
      toast.error('Unable to remove the timeline event.');
      return;
    }
    if (result.validEventTypes.length > 0) {
      setValidEventTypes(result.validEventTypes);
    }
    toast.success('Timeline event removed.');
  };

  const handleApplyIssueFilters = async () => {
    if (!projectId) return;
    await fetchIssues(projectId, {
      severity: issueFilters.severity === 'all' ? '' : issueFilters.severity,
      status: issueFilters.status === 'all' ? '' : issueFilters.status,
      issueType: issueFilters.issueType === 'all' ? '' : issueFilters.issueType,
    });
  };

  const handleCreateIssue = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectId) return;
    if (!issueForm.title.trim()) {
      toast.error('Add an issue title first.');
      return;
    }

    const result = await createIssue({
      projectId,
      title: issueForm.title.trim(),
      description: issueForm.description.trim(),
      severity: issueForm.severity,
      issueType: issueForm.issueType,
      location: issueForm.location.trim(),
    });

    if (!result) {
      toast.error('Unable to report the issue.');
      return;
    }

    setIssueForm({
      title: '',
      description: '',
      severity: issueMeta.validSeverities[0] ?? 'Medium',
      issueType: issueMeta.validTypes[0] ?? 'Other',
      location: '',
    });
    await handleApplyIssueFilters();
    toast.success('Issue reported.');
  };

  const handleIssueDraftChange = (
    issueId: string,
    next: Partial<{ status: string; assignedTo: string; resolutionNote: string }>
  ) => {
    setIssueUpdateDrafts((current) => ({
      ...current,
      [issueId]: {
        status: next.status ?? current[issueId]?.status ?? 'Open',
        assignedTo: next.assignedTo ?? current[issueId]?.assignedTo ?? '',
        resolutionNote: next.resolutionNote ?? current[issueId]?.resolutionNote ?? '',
      },
    }));
  };

  const handleUpdateIssue = async (issueId: string) => {
    if (!projectId) return;
    const draft = issueUpdateDrafts[issueId];
    if (!draft?.status) {
      toast.error('Choose a status for the issue.');
      return;
    }

    const result = await updateIssueStatus(projectId, issueId, draft);
    if (!result) {
      toast.error('Unable to update the issue.');
      return;
    }

    await handleApplyIssueFilters();
    toast.success('Issue updated.');
  };

  const handleApplySiteLogRange = async () => {
    if (!projectId) return;
    await fetchSiteConditions(projectId, siteLogFilters.from || undefined, siteLogFilters.to || undefined);
  };

  const handleCreateSiteLog = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectId || !siteLogForm.date) {
      toast.error('Add the log date first.');
      return;
    }

    const result = await createSiteCondition({
      projectId,
      date: siteLogForm.date,
      weather: siteLogForm.weather,
      temperatureCelsius: Number(siteLogForm.temperatureCelsius || 0),
      workersPresent: Number(siteLogForm.workersPresent || 0),
      machinesOperational: Number(siteLogForm.machinesOperational || 0),
      workStatus: siteLogForm.workStatus,
      delayReason: siteLogForm.delayReason.trim(),
      safetyIncidents: Number(siteLogForm.safetyIncidents || 0),
      notes: siteLogForm.notes.trim(),
    });

    if (!result) {
      toast.error('Unable to log site conditions.');
      return;
    }

    setSiteLogForm({
      date: '',
      weather: siteSummaryMeta.validWeather[0] ?? 'Sunny',
      temperatureCelsius: '',
      workersPresent: '',
      machinesOperational: '',
      workStatus: siteSummaryMeta.validWorkStatuses[0] ?? 'Normal',
      delayReason: '',
      safetyIncidents: '0',
      notes: '',
    });
    await handleApplySiteLogRange();
    toast.success('Site condition logged.');
  };

  const handleCreateSignoff = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectId) return;
    if (!signoffForm.title.trim()) {
      toast.error('Add a sign-off title first.');
      return;
    }

    const result = await createSignoff({
      projectId,
      signoffType: signoffForm.signoffType,
      title: signoffForm.title.trim(),
      remarks: signoffForm.remarks.trim(),
      isPublic: signoffForm.isPublic,
      attachmentUrl: signoffForm.attachmentUrl.trim(),
    });

    if (!result) {
      toast.error('Unable to issue the sign-off.');
      return;
    }

    setSignoffForm({
      signoffType: signoffTypes[0] ?? 'Phase Completion',
      title: '',
      remarks: '',
      isPublic: true,
      attachmentUrl: '',
    });
    toast.success('Sign-Off issued and team notified');
  };

  if (projectLoading && !project) {
    return (
      <div className="app-surface flex h-[320px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (projectError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Project unavailable</AlertTitle>
        <AlertDescription>{projectError}</AlertDescription>
      </Alert>
    );
  }

  if (!project) {
    return (
      <div className="app-surface p-10">
        <Empty className="border border-dashed border-border bg-muted/20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpenDot className="h-4 w-4" />
            </EmptyMedia>
            <EmptyTitle>No project found</EmptyTitle>
            <EmptyDescription>
              The requested project could not be loaded from this workspace.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="page-grid mx-auto w-full max-w-[1440px]">
      {actionsError ? (
        <Alert variant="destructive">
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{actionsError}</AlertDescription>
        </Alert>
      ) : null}

      {workspaceError ? (
        <Alert variant="destructive">
          <AlertTitle>Workspace data failed</AlertTitle>
          <AlertDescription>{workspaceError}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="border-border/80">
        <CardHeader className="gap-6">
          <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="space-y-4">
              <Button variant="outline" className="w-fit rounded-2xl" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <div className="flex flex-wrap gap-2">
                <Badge className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${statusToneClass(project.status)}`}>
                  {project.status}
                </Badge>
                {prediction ? (
                  <Badge className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${riskToneClass(prediction.riskLevel)}`}>
                    {prediction.riskLevel} risk
                  </Badge>
                ) : null}
                {project.projectType ? (
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
                    {project.projectType}
                  </Badge>
                ) : null}
              </div>

              <div>
                <CardTitle className="text-3xl">{project.name}</CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-6">
                  {project.description || 'No project description has been added yet.'}
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {projectTags.length > 0 ? (
                  projectTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
                    >
                      {tag}
                      {canManage ? (
                        <button
                          type="button"
                          className="text-muted-foreground transition-colors hover:text-destructive"
                          onClick={() => void handleRemoveTag(tag)}
                          aria-label={`Remove ${tag}`}
                        >
                          ×
                        </button>
                      ) : null}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-dashed border-border px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    No tags yet
                  </span>
                )}
              </div>

              {canManage ? (
                <div className="flex w-full max-w-3xl flex-col gap-2 lg:flex-row">
                  <Select value={selectedTagOption || 'none'} onValueChange={(value) => setSelectedTagOption(value === 'none' ? '' : value)}>
                    <SelectTrigger className="h-11 min-w-[220px] rounded-2xl">
                      <SelectValue placeholder="Choose an existing tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Choose an existing tag</SelectItem>
                      {availableTags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    placeholder="Or create tags, separated by commas"
                    className="h-11 rounded-2xl"
                  />
                  <Button className="rounded-2xl" onClick={() => void handleAddTags()}>
                    <PencilLine className="h-4 w-4" />
                    Add tag
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button variant="outline" className="rounded-2xl" onClick={() => setAuditOpen(true)}>
                      <FileText className="h-4 w-4" />
                      Audit report
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">Open the printable project summary</TooltipContent>
              </Tooltip>

              {canManage ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <Button className="rounded-2xl" onClick={() => setMilestoneDialogOpen(true)}>
                          <CirclePlus className="h-4 w-4" />
                          Milestone
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Add a milestone checkpoint</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <Button variant="outline" className="rounded-2xl" onClick={() => setUpdateDialogOpen(true)}>
                          <CalendarClock className="h-4 w-4" />
                          Update
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Post a delivery update</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <Button variant="outline" className="rounded-2xl" onClick={() => setGalleryDialogOpen(true)}>
                          <ImagePlus className="h-4 w-4" />
                          Gallery
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Upload site photos with coordinates</TooltipContent>
                  </Tooltip>
                </>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <div className="metric-card">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Location</p>
            <p className="mt-2 font-semibold text-foreground">{projectLocation || 'Not specified'}</p>
          </div>
          <div className="metric-card">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Team size</p>
            <p className="mt-2 font-semibold text-foreground">{project.teamsize} members</p>
          </div>
          <div className="metric-card">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Budget</p>
            <p className="mt-2 font-semibold text-foreground">{formatCurrency(project.funding?.estimatedBudget)}</p>
          </div>
          <div className="metric-card">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Runway</p>
            <p className="mt-2 font-semibold text-foreground">
              {runwayInfo?.daysLeft === Infinity ? 'Stable' : runwayInfo ? `${runwayInfo.daysLeft} days left` : 'Unavailable'}
            </p>
          </div>
          <div className="metric-card">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span>Completion</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="mt-3 h-2" />
            <p className="mt-3 text-xs text-muted-foreground">{milestones.length} milestones tracked</p>
          </div>
        </CardContent>
      </Card>

<Tabs defaultValue="overview" className="min-w-0 flex flex-col gap-6">
        <div className="sticky top-4 z-20 overflow-hidden rounded-2xl border border-border/70 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
<TabsList
  variant="line"
  className="flex w-full justify-start overflow-x-auto rounded-none px-2 py-2 whitespace-nowrap"
><TabsTrigger value="overview" className="shrink-0 px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-medium rounded-xl">Overview</TabsTrigger>
<TabsTrigger value="milestones" className="shrink-0 px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-medium rounded-xl">Milestones</TabsTrigger>
<TabsTrigger value="updates" className="shrink-0 px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-medium rounded-xl">Updates</TabsTrigger>
<TabsTrigger value="files" className="shrink-0 px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-medium rounded-xl">Files</TabsTrigger>
<TabsTrigger value="timeline" className="shrink-0 px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-medium rounded-xl">Timeline</TabsTrigger>
<TabsTrigger value="issues" className="shrink-0 px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-medium rounded-xl">Issues</TabsTrigger>
<TabsTrigger value="site-logs" className="shrink-0 px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-medium rounded-xl">Site Logs</TabsTrigger>
<TabsTrigger value="approvals" className="shrink-0 px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-medium rounded-xl">Approvals</TabsTrigger>

          </TabsList>
        </div>

        <div className="min-w-0 overflow-x-hidden">
        <TabsContent value="overview" className="min-w-0 space-y-6">
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle>Delivery outlook</CardTitle>
                <CardDescription>
                  Timeline pressure, funding runway, and the current forecast summary.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {prediction ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="soft-panel">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Confidence</p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {Math.round(prediction.confidenceScore * 100)}%
                        </p>
                        <Progress value={prediction.confidenceScore * 100} className="mt-3 h-2" />
                      </div>

                      <div className="soft-panel">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Projected total days</p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">{prediction.predictedTotalDays}</p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          Start: {formatDate(project.timeline?.startDate, 'Not set')}
                        </p>
                      </div>
                    </div>

                    <div className="soft-panel">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Summary</p>
                      <p className="mt-3 text-sm leading-7 text-foreground">{prediction.delayReasoning}</p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pressure points</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {prediction.bottlenecks.length > 0 ? (
                          prediction.bottlenecks.map((bottleneck) => (
                            <div key={bottleneck} className="soft-panel text-sm text-foreground">
                              {bottleneck}
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground sm:col-span-2">
                            No specific bottlenecks are being flagged right now.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
                    Forecast details are still being prepared for this project.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardHeader className="gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Site coverage</CardTitle>
                    <CardDescription>
                      Coordinates and the most recent field evidence for this project.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
                    {totalPhotos} photos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[360px] overflow-hidden rounded-3xl border border-border/70">
                  <GISData projectId={projectId} />
                </div>
              </CardContent>
            </Card>
          </div>

          {projectId ? (
            <FundTracker
              projectId={projectId}
              estimatedBudget={project.funding?.estimatedBudget}
              startDate={project.timeline?.startDate}
            />
          ) : null}

          <div className="grid gap-6 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <Card className="border-border/80">
              <CardHeader className="gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Announcements</CardTitle>
                    <CardDescription>
                      Broadcast project-critical updates with priority and clear visibility.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
                    {announcementList.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {canManage ? (
                  <form className="soft-panel space-y-4" onSubmit={handleCreateAnnouncement}>
                    <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                      <div className="space-y-2">
                        <Label htmlFor="announcement-title">Title</Label>
                        <Input
                          id="announcement-title"
                          value={announcementForm.title}
                          onChange={(event) =>
                            setAnnouncementForm((current) => ({ ...current, title: event.target.value }))
                          }
                          className="h-11 rounded-2xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select
                          value={announcementForm.priority}
                          onValueChange={(value) =>
                            setAnnouncementForm((current) => ({ ...current, priority: value }))
                          }
                        >
                          <SelectTrigger className="h-11 rounded-2xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map((priority) => (
                              <SelectItem key={priority} value={priority}>
                                {priority}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="announcement-body">Body</Label>
                      <Textarea
                        id="announcement-body"
                        value={announcementForm.body}
                        onChange={(event) =>
                          setAnnouncementForm((current) => ({ ...current, body: event.target.value }))
                        }
                        className="rounded-2xl"
                        rows={4}
                      />
                    </div>

                    <Button type="submit" className="rounded-2xl" disabled={workspaceLoading}>
                      Post announcement
                    </Button>
                  </form>
                ) : null}

                {announcementList.length === 0 ? (
                  <Empty className="border border-dashed border-border bg-muted/20">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Flag className="h-4 w-4" />
                      </EmptyMedia>
                      <EmptyTitle>No announcements yet</EmptyTitle>
                      <EmptyDescription>Project-wide updates will appear here once shared.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  announcementList.map((announcement) => (
                    <div key={announcement.id} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{announcement.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(announcement.createdAt, 'No date')}
                          </p>
                        </div>
                        <Badge
                          className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${priorityToneClass(announcement.priority)}`}
                        >
                          {announcement.priority}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{announcement.body}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <ActivityFeed
              projectId={projectId}
              title="Project activity"
              description="Recent actions connected to this project, including timeline, files, and announcements."
            />
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="min-w-0 space-y-6">
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle>Milestone analytics</CardTitle>
                <CardDescription>
                  Completion rate, overdue count, status mix, and projected finish timing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {analytics?.totalMilestones ? (
                  <>
                    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
                      <div className="relative mx-auto h-[220px] w-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart
                            innerRadius="72%"
                            outerRadius="100%"
                            data={[{ name: 'completion', value: analytics.completionRate ?? 0, fill: 'hsl(var(--primary))' }]}
                            startAngle={90}
                            endAngle={-270}
                          >
                            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                            <RadialBar background dataKey="value" cornerRadius={18} />
                          </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-3xl font-semibold text-foreground">{analytics.completionRate ?? 0}%</p>
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Complete</p>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="metric-card">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Overdue milestones</p>
                          <p className="mt-2 text-2xl font-semibold text-foreground">{analytics.overdueCount ?? 0}</p>
                        </div>
                        <div className="metric-card">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Projected finish</p>
                          <p className="mt-2 text-2xl font-semibold text-foreground">
                            {analytics.projectedDaysToFinish ?? '—'}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">Days remaining at current pace</p>
                        </div>
                        <div className="metric-card">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Completed</p>
                          <p className="mt-2 text-2xl font-semibold text-foreground">{analytics.completedCount ?? 0}</p>
                        </div>
                        <div className="metric-card">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Average progress</p>
                          <p className="mt-2 text-2xl font-semibold text-foreground">{analytics.averageProgress ?? 0}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                      <p className="mb-4 text-sm font-semibold text-foreground">Status breakdown</p>
                      <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statusBreakdownData}>
                            <XAxis dataKey="label" axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                            <RechartsTooltip />
                            <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                              {statusBreakdownData.map((entry) => (
                                <Cell key={entry.label} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
                    {analytics?.message || 'Analytics will appear once milestones have been added.'}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardHeader className="gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Milestones</CardTitle>
                    <CardDescription>Planned checkpoints and completion progress.</CardDescription>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
                    {milestones.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {extrasLoading && milestones.length === 0 ? (
                  <div className="flex h-40 items-center justify-center">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                  </div>
                ) : milestones.length === 0 ? (
                  <Empty className="border border-dashed border-border bg-muted/20">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <CirclePlus className="h-4 w-4" />
                      </EmptyMedia>
                      <EmptyTitle>No milestones yet</EmptyTitle>
                      <EmptyDescription>Start tracking progress by adding the first milestone.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  milestones.map((milestone) => (
                    <div key={milestone.id} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{milestone.title}</p>
                          {milestone.description ? (
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{milestone.description}</p>
                          ) : null}
                        </div>
                        <Badge className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${statusToneClass(milestone.status)}`}>
                          {milestone.status?.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{milestone.progress ?? 0}%</span>
                        </div>
                        <Progress value={milestone.progress ?? 0} className="mt-2 h-2" />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>Start: {formatDate(milestone.startDate, 'Not set')}</span>
                        <span>End: {formatDate(milestone.endDate, 'Not set')}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="updates" className="min-w-0 space-y-6">
          <div className="grid gap-6 2xl:grid-cols-2">
            <Card className="border-border/80">
              <CardHeader className="gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Project updates</CardTitle>
                    <CardDescription>Announcements, delays, and recent delivery notes.</CardDescription>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
                    {projectUpdates.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {projectUpdates.length === 0 ? (
                  <Empty className="border border-dashed border-border bg-muted/20">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <CalendarClock className="h-4 w-4" />
                      </EmptyMedia>
                      <EmptyTitle>No updates posted</EmptyTitle>
                      <EmptyDescription>The team has not shared any project notes yet.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  projectUpdates.map((update) => (
                    <div key={update.id} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{update.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(update.createdAt, 'No date')}
                          </p>
                        </div>
                        <Badge className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${updateToneClass(update.updateType)}`}>
                          {update.updateType}
                        </Badge>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{update.description}</p>

                      {update.attachments?.length > 0 ? (
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {update.attachments.map((attachment, index) => (
                            <a
                              key={`${update.id}-${index}`}
                              href={attachment}
                              target="_blank"
                              rel="noreferrer"
                              className="group overflow-hidden rounded-2xl border border-border/70 bg-background"
                            >
                              <img
                                src={attachment}
                                alt={`${update.title} attachment ${index + 1}`}
                                className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardHeader className="gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Site gallery</CardTitle>
                    <CardDescription>Photo evidence from field reports and geotagged visits.</CardDescription>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
                    {totalPhotos} photos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {progressReports.length === 0 ? (
                  <Empty className="border border-dashed border-border bg-muted/20">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <MapPinned className="h-4 w-4" />
                      </EmptyMedia>
                      <EmptyTitle>No field gallery yet</EmptyTitle>
                      <EmptyDescription>
                        Upload geotagged site photos to build a reliable visual trail.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {progressReports.flatMap((report) =>
                      report.images?.map((image, index) => (
                        <a
                          key={`${report.id}-${index}`}
                          href={image}
                          target="_blank"
                          rel="noreferrer"
                          className="group overflow-hidden rounded-3xl border border-border/70 bg-background"
                        >
                          <div className="aspect-[1/0.9] overflow-hidden">
                            <img
                              src={image}
                              alt={report.description || `Field report ${index + 1}`}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          <div className="space-y-2 border-t border-border/70 p-4">
                            <p className="line-clamp-2 text-sm font-medium text-foreground">
                              {report.description || 'Field update'}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>{formatDate(report.timestamp, 'No date')}</span>
                              <span>
                                {report.gpsCoordinates?.latitude?.toFixed?.(4) || '--'},{' '}
                                {report.gpsCoordinates?.longitude?.toFixed?.(4) || '--'}
                              </span>
                            </div>
                          </div>
                        </a>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="files" className="min-w-0 space-y-6">
          <Card className="border-border/80">
            <CardHeader className="gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Project files</CardTitle>
                  <CardDescription>Upload and manage project attachments, evidence, and reference documents.</CardDescription>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
                  {documentList.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {canManage ? (
                <form className="soft-panel grid gap-4 lg:grid-cols-[1fr_200px_auto]" onSubmit={handleUploadDocument}>
                  <div className="space-y-2">
                    <Label htmlFor="project-document-input">Document</Label>
                    <input
                      id="project-document-input"
                      type="file"
                      className="file-picker"
                      onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document-tags">Tags</Label>
                    <Input
                      id="document-tags"
                      value={documentTags}
                      onChange={(event) => setDocumentTags(event.target.value)}
                      placeholder="drawings, permits"
                      className="h-11 rounded-2xl"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full rounded-2xl" disabled={workspaceLoading}>
                      Upload file
                    </Button>
                  </div>
                </form>
              ) : null}

              {documentList.length === 0 ? (
                <Empty className="border border-dashed border-border bg-muted/20">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileText className="h-4 w-4" />
                    </EmptyMedia>
                    <EmptyTitle>No files uploaded</EmptyTitle>
                    <EmptyDescription>Documents added to this project will appear here.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="grid gap-4">
                  {documentList.map((documentItem) => (
                    <div key={documentItem.id} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                            {fileIcon(documentItem.fileType)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{documentItem.fileName}</p>
                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span>{documentItem.fileType || 'Unknown file type'}</span>
                              <span>{formatFileSize(documentItem.fileSize)}</span>
                              <span>{formatDate(documentItem.uploadedAt, 'No date')}</span>
                            </div>
                            {documentItem.tags?.length ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {documentItem.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full bg-background px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button asChild variant="outline" className="rounded-2xl">
                            <a href={documentItem.fileUrl} target="_blank" rel="noreferrer">
                              <Download className="h-4 w-4" />
                              Download
                            </a>
                          </Button>
                          {canManage ? (
                            <Button
                              variant="ghost"
                              className="rounded-2xl text-destructive hover:text-destructive"
                              onClick={() => void handleDeleteDocument(documentItem.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="min-w-0 space-y-6">
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle>Timeline management</CardTitle>
                <CardDescription>
                  Track major inspections, milestones, legal events, and site moments in chronological order.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {canManage ? (
                  <form className="space-y-4" onSubmit={handleCreateTimelineEvent}>
                    <div className="space-y-2">
                      <Label htmlFor="timeline-title">Title</Label>
                      <Input
                        id="timeline-title"
                        value={timelineForm.title}
                        onChange={(event) => setTimelineForm((current) => ({ ...current, title: event.target.value }))}
                        className="h-11 rounded-2xl"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Event type</Label>
                        <Select
                          value={timelineForm.eventType}
                          onValueChange={(value) =>
                            setTimelineForm((current) => ({ ...current, eventType: value }))
                          }
                        >
                          <SelectTrigger className="h-11 rounded-2xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(validEventTypes.length ? validEventTypes : DEFAULT_TIMELINE_TYPES).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timeline-date">Event date</Label>
                        <Input
                          id="timeline-date"
                          type="date"
                          value={timelineForm.eventDate}
                          onChange={(event) =>
                            setTimelineForm((current) => ({ ...current, eventDate: event.target.value }))
                          }
                          className="h-11 rounded-2xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeline-description">Description</Label>
                      <Textarea
                        id="timeline-description"
                        value={timelineForm.description}
                        onChange={(event) =>
                          setTimelineForm((current) => ({ ...current, description: event.target.value }))
                        }
                        className="rounded-2xl"
                        rows={5}
                      />
                    </div>

                    <Button type="submit" className="rounded-2xl" disabled={workspaceLoading}>
                      Add event
                    </Button>
                  </form>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
                    Timeline management is available for owner and admin roles.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardHeader className="gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Timeline</CardTitle>
                    <CardDescription>Major events sorted by event date.</CardDescription>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
                    {timelineList.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {timelineList.length === 0 ? (
                  <Empty className="border border-dashed border-border bg-muted/20">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <CalendarClock className="h-4 w-4" />
                      </EmptyMedia>
                      <EmptyTitle>No timeline events yet</EmptyTitle>
                      <EmptyDescription>Add the first dated event to begin the project timeline.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="space-y-4">
                    {timelineList.map((timelineEvent: TimelineEvent, index) => (
                      <div key={timelineEvent.id} className="relative pl-10">
                        {index < timelineList.length - 1 ? (
                          <span className="absolute left-[19px] top-10 h-[calc(100%-0.5rem)] w-px bg-border" />
                        ) : null}
                        <div className="absolute left-0 top-1 grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                          {eventTypeIcon(timelineEvent.eventType)}
                        </div>
                        <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-foreground">{timelineEvent.title}</p>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>{timelineEvent.eventType}</span>
                                <span>{formatDate(timelineEvent.eventDate, 'No date')}</span>
                              </div>
                            </div>
                            {canManage ? (
                              <Button
                                variant="ghost"
                                className="rounded-2xl text-destructive hover:text-destructive"
                                onClick={() => void handleDeleteTimelineEvent(timelineEvent.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            ) : null}
                          </div>
                          {timelineEvent.description ? (
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{timelineEvent.description}</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="min-w-0 space-y-6">
          <Card className="border-border/80">
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
                <div>
                  <CardTitle>Issue tracker</CardTitle>
                  <CardDescription>
                    Report defects, filter by severity and status, and keep resolution details attached to the project.
                  </CardDescription>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Select
                    value={issueFilters.severity}
                    onValueChange={(value) => setIssueFilters((current) => ({ ...current, severity: value }))}
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All severities</SelectItem>
                      {(issueMeta.validSeverities.length ? issueMeta.validSeverities : ['Critical', 'High', 'Medium', 'Low']).map((severity) => (
                        <SelectItem key={severity} value={severity}>
                          {severity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={issueFilters.status}
                    onValueChange={(value) => setIssueFilters((current) => ({ ...current, status: value }))}
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {(issueMeta.validStatuses.length ? issueMeta.validStatuses : ['Open', 'In Progress', 'Resolved', 'Critical']).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={issueFilters.issueType}
                    onValueChange={(value) => setIssueFilters((current) => ({ ...current, issueType: value }))}
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All issue types</SelectItem>
                      {(issueMeta.validTypes.length ? issueMeta.validTypes : ['Structural', 'Safety', 'Electrical', 'Other']).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="rounded-2xl" onClick={() => void handleApplyIssueFilters()}>
                  Apply filters
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-2xl"
                  onClick={() => {
                    setIssueFilters({ severity: 'all', status: 'all', issueType: 'all' });
                    void fetchIssues(projectId!);
                  }}
                >
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                <div className="metric-card">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{issueStats.total}</p>
                </div>
                <div className="metric-card">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Open</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{issueStats.open}</p>
                </div>
                <div className="metric-card">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Critical</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{issueStats.critical}</p>
                </div>
                <div className="metric-card">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Resolved</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{issueStats.resolved}</p>
                </div>
              </div>

              <div className="grid gap-6 2xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
                <Card className="border-border/70">
                  <CardHeader>
                    <CardTitle>Report issue</CardTitle>
                    <CardDescription>Create a new defect or site issue for the team to track.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4" onSubmit={handleCreateIssue}>
                      <div className="space-y-2">
                        <Label htmlFor="issue-title">Title</Label>
                        <Input
                          id="issue-title"
                          value={issueForm.title}
                          onChange={(event) => setIssueForm((current) => ({ ...current, title: event.target.value }))}
                          className="h-11 rounded-2xl"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Severity</Label>
                          <Select
                            value={issueForm.severity}
                            onValueChange={(value) => setIssueForm((current) => ({ ...current, severity: value }))}
                          >
                            <SelectTrigger className="h-11 rounded-2xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(issueMeta.validSeverities.length ? issueMeta.validSeverities : ['Critical', 'High', 'Medium', 'Low']).map((severity) => (
                                <SelectItem key={severity} value={severity}>
                                  {severity}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Issue type</Label>
                          <Select
                            value={issueForm.issueType}
                            onValueChange={(value) => setIssueForm((current) => ({ ...current, issueType: value }))}
                          >
                            <SelectTrigger className="h-11 rounded-2xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(issueMeta.validTypes.length ? issueMeta.validTypes : ['Structural', 'Safety', 'Electrical', 'Other']).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="issue-location">Location on site</Label>
                        <Input
                          id="issue-location"
                          value={issueForm.location}
                          onChange={(event) => setIssueForm((current) => ({ ...current, location: event.target.value }))}
                          className="h-11 rounded-2xl"
                          placeholder="North retaining wall"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="issue-description">Description</Label>
                        <Textarea
                          id="issue-description"
                          value={issueForm.description}
                          onChange={(event) => setIssueForm((current) => ({ ...current, description: event.target.value }))}
                          className="rounded-2xl"
                          rows={5}
                        />
                      </div>
                      <Button type="submit" className="rounded-2xl" disabled={workspaceLoading}>
                        Report issue
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="border-border/70">
                  <CardHeader>
                    <CardTitle>Issue list</CardTitle>
                    <CardDescription>Severity-coded defects with assignee and resolution state.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {issueList.length === 0 ? (
                      <Empty className="border border-dashed border-border bg-muted/20">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <AlertTriangle className="h-4 w-4" />
                          </EmptyMedia>
                          <EmptyTitle>No issues found</EmptyTitle>
                          <EmptyDescription>No issues match the current filter set.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      issueList.map((issue) => {
                        const draft = issueUpdateDrafts[issue.id] ?? {
                          status: issue.status,
                          assignedTo: issue.assignedTo ?? '',
                          resolutionNote: issue.resolutionNote ?? '',
                        };
                        return (
                          <div key={issue.id} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  <Badge className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${issueSeverityToneClass(issue.severity)}`}>
                                    {issue.severity}
                                  </Badge>
                                  <Badge className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${issueStatusToneClass(issue.status)}`}>
                                    {issue.status}
                                  </Badge>
                                  <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]">
                                    {issue.issueType}
                                  </Badge>
                                </div>
                                <p className="text-base font-semibold text-foreground">{issue.title}</p>
                                <p className="text-sm leading-6 text-muted-foreground">{issue.description}</p>
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                  <span>Location: {issue.location || 'Unspecified'}</span>
                                  <span>Logged: {formatDate(issue.createdAt, 'No date')}</span>
                                </div>
                              </div>
                            </div>

                            {canManage ? (
                              <div className="mt-4 grid gap-4 rounded-2xl border border-border/70 bg-background p-4 lg:grid-cols-[180px_1fr_1fr_auto]">
                                <div className="space-y-2">
                                  <Label>Status</Label>
                                  <Select
                                    value={draft.status}
                                    onValueChange={(value) => handleIssueDraftChange(issue.id, { status: value })}
                                  >
                                    <SelectTrigger className="h-11 rounded-2xl">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(issueMeta.validStatuses.length ? issueMeta.validStatuses : ['Open', 'In Progress', 'Resolved', 'Critical']).map((status) => (
                                        <SelectItem key={status} value={status}>
                                          {status}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Assign to user ID</Label>
                                  <Input
                                    value={draft.assignedTo}
                                    onChange={(event) => handleIssueDraftChange(issue.id, { assignedTo: event.target.value })}
                                    className="h-11 rounded-2xl"
                                    placeholder="Optional assignee id"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Resolution note</Label>
                                  <Input
                                    value={draft.resolutionNote}
                                    onChange={(event) => handleIssueDraftChange(issue.id, { resolutionNote: event.target.value })}
                                    className="h-11 rounded-2xl"
                                    placeholder="Resolution summary"
                                  />
                                </div>
                                <div className="flex items-end">
                                  <Button className="w-full rounded-2xl" onClick={() => void handleUpdateIssue(issue.id)}>
                                    Update
                                  </Button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="site-logs" className="min-w-0 space-y-6">
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle>Log today's conditions</CardTitle>
                <CardDescription>Capture daily weather, workforce, machine availability, and work status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <form className="space-y-4" onSubmit={handleCreateSiteLog}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="site-date">Date</Label>
                      <Input
                        id="site-date"
                        type="date"
                        value={siteLogForm.date}
                        onChange={(event) => setSiteLogForm((current) => ({ ...current, date: event.target.value }))}
                        className="h-11 rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Weather</Label>
                      <Select
                        value={siteLogForm.weather}
                        onValueChange={(value) => setSiteLogForm((current) => ({ ...current, weather: value }))}
                      >
                        <SelectTrigger className="h-11 rounded-2xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(siteSummaryMeta.validWeather.length ? siteSummaryMeta.validWeather : ['Sunny', 'Cloudy', 'Rain', 'Storm']).map((weather) => (
                            <SelectItem key={weather} value={weather}>
                              {weather}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Temperature (C)</Label>
                      <Input
                        value={siteLogForm.temperatureCelsius}
                        onChange={(event) => setSiteLogForm((current) => ({ ...current, temperatureCelsius: event.target.value }))}
                        className="h-11 rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Workers present</Label>
                      <Input
                        value={siteLogForm.workersPresent}
                        onChange={(event) => setSiteLogForm((current) => ({ ...current, workersPresent: event.target.value }))}
                        className="h-11 rounded-2xl"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Machines operational</Label>
                      <Input
                        value={siteLogForm.machinesOperational}
                        onChange={(event) => setSiteLogForm((current) => ({ ...current, machinesOperational: event.target.value }))}
                        className="h-11 rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Work status</Label>
                      <Select
                        value={siteLogForm.workStatus}
                        onValueChange={(value) => setSiteLogForm((current) => ({ ...current, workStatus: value }))}
                      >
                        <SelectTrigger className="h-11 rounded-2xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(siteSummaryMeta.validWorkStatuses.length ? siteSummaryMeta.validWorkStatuses : ['Normal', 'Delayed', 'Halted']).map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Safety incidents</Label>
                      <Input
                        value={siteLogForm.safetyIncidents}
                        onChange={(event) => setSiteLogForm((current) => ({ ...current, safetyIncidents: event.target.value }))}
                        className="h-11 rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Delay reason</Label>
                      <Input
                        value={siteLogForm.delayReason}
                        onChange={(event) => setSiteLogForm((current) => ({ ...current, delayReason: event.target.value }))}
                        className="h-11 rounded-2xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={siteLogForm.notes}
                      onChange={(event) => setSiteLogForm((current) => ({ ...current, notes: event.target.value }))}
                      className="rounded-2xl"
                      rows={4}
                    />
                  </div>

                  <Button type="submit" className="rounded-2xl" disabled={workspaceLoading}>
                    Log conditions
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardHeader className="gap-4">
                <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
                  <div>
                    <CardTitle>Site log summary</CardTitle>
                    <CardDescription>Review site condition history and operational trends over time.</CardDescription>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      type="date"
                      value={siteLogFilters.from}
                      onChange={(event) => setSiteLogFilters((current) => ({ ...current, from: event.target.value }))}
                      className="h-11 rounded-2xl"
                    />
                    <Input
                      type="date"
                      value={siteLogFilters.to}
                      onChange={(event) => setSiteLogFilters((current) => ({ ...current, to: event.target.value }))}
                      className="h-11 rounded-2xl"
                    />
                  </div>
                </div>
                <Button variant="outline" className="w-fit rounded-2xl" onClick={() => void handleApplySiteLogRange()}>
                  Apply date range
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                  <div className="metric-card">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total days logged</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{siteSummaryMeta.summary.totalDaysLogged}</p>
                  </div>
                  <div className="metric-card">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Safety incidents</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{siteSummaryMeta.summary.totalSafetyIncidents}</p>
                  </div>
                  <div className="metric-card">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Halted days</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{siteSummaryMeta.summary.haltedDays}</p>
                  </div>
                  <div className="metric-card">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Workers deployed</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{siteSummaryMeta.summary.totalWorkersDeployed}</p>
                  </div>
                </div>

                <div className="grid gap-6 2xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                  <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <CloudSun className="h-4 w-4 text-primary" />
                      Weather frequency
                    </div>
                    <div className="h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={weatherFrequencyData} dataKey="value" nameKey="name" outerRadius={80} label>
                            {weatherFrequencyData.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={[
                                  'hsl(var(--primary))',
                                  'hsl(var(--status-warning))',
                                  'hsl(var(--status-success))',
                                  'hsl(var(--status-danger))',
                                ][index % 4]}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-border/70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Weather</TableHead>
                          <TableHead>Workers</TableHead>
                          <TableHead>Machines</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Incidents</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {siteLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                              No site logs found for the current range.
                            </TableCell>
                          </TableRow>
                        ) : (
                          siteLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>{formatDate(log.date, 'No date')}</TableCell>
                              <TableCell>{log.weather}</TableCell>
                              <TableCell>{log.workersPresent ?? 0}</TableCell>
                              <TableCell>{log.machinesOperational ?? 0}</TableCell>
                              <TableCell>{log.workStatus}</TableCell>
                              <TableCell>{log.safetyIncidents ?? 0}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="min-w-0 space-y-6">
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle>Issue sign-off</CardTitle>
                <CardDescription>Create a project approval and optionally expose it publicly.</CardDescription>
              </CardHeader>
              <CardContent>
                {canManage ? (
                  <form className="space-y-4" onSubmit={handleCreateSignoff}>
                    <div className="space-y-2">
                      <Label>Sign-off type</Label>
                      <Select
                        value={signoffForm.signoffType}
                        onValueChange={(value) => setSignoffForm((current) => ({ ...current, signoffType: value }))}
                      >
                        <SelectTrigger className="h-11 rounded-2xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(signoffTypes.length ? signoffTypes : ['Phase Completion', 'Inspection Passed', 'Budget Approval']).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={signoffForm.title}
                        onChange={(event) => setSignoffForm((current) => ({ ...current, title: event.target.value }))}
                        className="h-11 rounded-2xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Remarks</Label>
                      <Textarea
                        value={signoffForm.remarks}
                        onChange={(event) => setSignoffForm((current) => ({ ...current, remarks: event.target.value }))}
                        className="rounded-2xl"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Certificate URL</Label>
                      <Input
                        value={signoffForm.attachmentUrl}
                        onChange={(event) => setSignoffForm((current) => ({ ...current, attachmentUrl: event.target.value }))}
                        className="h-11 rounded-2xl"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Visible on public portal</p>
                        <p className="text-xs text-muted-foreground">Only public sign-offs appear in the citizen view.</p>
                      </div>
                      <Switch
                        checked={signoffForm.isPublic}
                        onCheckedChange={(checked) => setSignoffForm((current) => ({ ...current, isPublic: checked }))}
                      />
                    </div>

                    <Button type="submit" className="rounded-2xl" disabled={workspaceLoading}>
                      Issue sign-off
                    </Button>
                  </form>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
                    Only owner and admin roles can issue sign-offs.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardHeader className="gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Approval history</CardTitle>
                    <CardDescription>Vertical checklist of sign-offs and project approvals.</CardDescription>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
                    {signoffList.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {signoffList.length === 0 ? (
                  <Empty className="border border-dashed border-border bg-muted/20">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <ClipboardCheck className="h-4 w-4" />
                      </EmptyMedia>
                      <EmptyTitle>No sign-offs yet</EmptyTitle>
                      <EmptyDescription>Issued approvals will appear here as a checklist.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="space-y-4">
                    {signoffList.map((signoff, index) => (
                      <div key={signoff.id} className="relative pl-10">
                        {index < signoffList.length - 1 ? (
                          <span className="absolute left-[19px] top-10 h-[calc(100%-0.5rem)] w-px bg-border" />
                        ) : null}
                        <div className="absolute left-0 top-1 grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                          {signoffIcon(signoff.signoffType)}
                        </div>
                        <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]">
                                  {signoff.signoffType}
                                </Badge>
                                {signoff.isPublic ? (
                                  <Badge className="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] status-success">
                                    Public
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="mt-2 font-semibold text-foreground">{signoff.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatDate(signoff.signedAt, 'No date')}
                              </p>
                            </div>
                          </div>
                          {signoff.remarks ? (
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{signoff.remarks}</p>
                          ) : null}
                          {signoff.attachmentUrl ? (
                            <Button asChild variant="outline" className="mt-4 rounded-2xl">
                              <a href={signoff.attachmentUrl} target="_blank" rel="noreferrer">
                                <Download className="h-4 w-4" />
                                View certificate
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        </div>
      </Tabs>

      <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 sm:max-w-2xl">
          <form onSubmit={handleCreateMilestone}>
            <DialogHeader className="border-b border-border px-6 py-5">
              <DialogTitle>Add milestone</DialogTitle>
              <DialogDescription>
                Capture the next checkpoint with dates, status, and completion progress.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 px-6 py-5">
              <div className="space-y-2">
                <Label htmlFor="milestone-title">Title</Label>
                <Input
                  id="milestone-title"
                  value={milestoneForm.title}
                  onChange={(event) => setMilestoneForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="h-11 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="milestone-description">Description</Label>
                <Textarea
                  id="milestone-description"
                  value={milestoneForm.description}
                  onChange={(event) => setMilestoneForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="rounded-xl"
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="milestone-start">Start date</Label>
                  <Input
                    id="milestone-start"
                    type="date"
                    value={milestoneForm.startDate}
                    onChange={(event) => setMilestoneForm((prev) => ({ ...prev, startDate: event.target.value }))}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="milestone-end">End date</Label>
                  <Input
                    id="milestone-end"
                    type="date"
                    value={milestoneForm.endDate}
                    onChange={(event) => setMilestoneForm((prev) => ({ ...prev, endDate: event.target.value }))}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="milestone-progress">Progress</Label>
                  <Input
                    id="milestone-progress"
                    type="number"
                    min={0}
                    max={100}
                    value={milestoneForm.progress}
                    onChange={(event) => setMilestoneForm((prev) => ({ ...prev, progress: event.target.value }))}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={milestoneForm.status}
                  onValueChange={(value) => setMilestoneForm((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-6 py-4">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setMilestoneDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={actionLoading}>
                {actionLoading ? 'Saving…' : 'Add milestone'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 sm:max-w-2xl">
          <form onSubmit={handleCreateProjectUpdate}>
            <DialogHeader className="border-b border-border px-6 py-5">
              <DialogTitle>Post update</DialogTitle>
              <DialogDescription>
                Share the latest delivery note, delay, completion item, or budget update.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 px-6 py-5">
              <div className="space-y-2">
                <Label htmlFor="update-title">Title</Label>
                <Input
                  id="update-title"
                  value={updateForm.title}
                  onChange={(event) => setUpdateForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="h-11 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={updateForm.updateType}
                  onValueChange={(value) => setUpdateForm((prev) => ({ ...prev, updateType: value }))}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UPDATE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-description">Description</Label>
                <Textarea
                  id="update-description"
                  value={updateForm.description}
                  onChange={(event) => setUpdateForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="rounded-xl"
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-attachments">Attachments</Label>
                <input
                  id="update-attachments"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(event) => setUpdateAttachments(Array.from(event.target.files ?? []))}
                  className="file-picker"
                />
                {updateAttachments.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {updateAttachments.length} file{updateAttachments.length > 1 ? 's' : ''} selected
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-6 py-4">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={actionLoading}>
                {actionLoading ? 'Posting…' : 'Post update'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={galleryDialogOpen} onOpenChange={setGalleryDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 sm:max-w-2xl">
          <form onSubmit={handleCreateGalleryUpload}>
            <DialogHeader className="border-b border-border px-6 py-5">
              <DialogTitle>Upload site photos</DialogTitle>
              <DialogDescription>
                Add geotagged photos so the field gallery stays useful and verifiable.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gallery-latitude">Latitude</Label>
                  <Input
                    id="gallery-latitude"
                    value={galleryForm.latitude}
                    onChange={(event) => setGalleryForm((prev) => ({ ...prev, latitude: event.target.value }))}
                    className="h-11 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gallery-longitude">Longitude</Label>
                  <Input
                    id="gallery-longitude"
                    value={galleryForm.longitude}
                    onChange={(event) => setGalleryForm((prev) => ({ ...prev, longitude: event.target.value }))}
                    className="h-11 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gallery-description">Caption</Label>
                <Textarea
                  id="gallery-description"
                  value={galleryForm.description}
                  onChange={(event) => setGalleryForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="rounded-xl"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gallery-images">Photos</Label>
                <input
                  id="gallery-images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(event) => setGalleryImages(Array.from(event.target.files ?? []))}
                  className="file-picker"
                  required
                />
                {galleryImages.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {galleryImages.length} image{galleryImages.length > 1 ? 's' : ''} selected
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-6 py-4">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setGalleryDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={actionLoading}>
                {actionLoading ? 'Uploading…' : 'Upload photos'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[92vh] max-w-[min(1100px,calc(100vw-2rem))] gap-0 overflow-hidden rounded-[28px] p-0 sm:max-w-[1100px]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-6 py-4">
            <div>
              <DialogTitle>Audit report</DialogTitle>
              <DialogDescription className="mt-1">
                A clean, printable summary of funding, milestones, and recent delivery updates.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button variant="ghost" className="rounded-xl" onClick={() => setAuditOpen(false)}>
                Close
              </Button>
            </div>
          </div>

          <div className="max-h-[calc(92vh-88px)] overflow-y-auto bg-muted/20 p-4 sm:p-6">
            <ProjectAuditReport
              project={project}
              milestones={milestones}
              updates={projectUpdates}
              prediction={prediction}
              runwayInfo={runwayInfo}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectDetail;
