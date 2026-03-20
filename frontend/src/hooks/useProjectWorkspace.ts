import { useCallback, useState } from 'react';
import instance, { getApiErrorMessage, publicInstance } from '@/api/api';

export interface ProjectAnnouncement {
  id: string;
  title: string;
  body: string;
  priority: 'Critical' | 'Urgent' | 'Normal' | string;
  postedBy?: string | null;
  createdAt?: string | null;
}

export interface ProjectDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  tags: string[];
  uploadedBy?: string | null;
  uploadedAt?: string | null;
}

export interface TimelineEvent {
  id: string;
  projectId?: string | null;
  title: string;
  description: string;
  eventType: string;
  eventDate: string;
  attachmentUrl?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
}

export interface MilestoneAnalytics {
  projectId: string;
  totalMilestones?: number;
  completionRate?: number;
  averageProgress?: number;
  overdueCount?: number;
  completedCount?: number;
  remainingCount?: number;
  statusBreakdown?: Record<string, number>;
  averageCompletionDays?: number | null;
  projectedDaysToFinish?: number | null;
  message?: string;
}

export interface ProjectIssue {
  id: string;
  projectId?: string | null;
  title: string;
  description: string;
  severity: string;
  issueType: string;
  status: string;
  reportedBy?: string | null;
  assignedTo?: string | null;
  imageUrls?: string[];
  location?: string;
  resolutionNote?: string | null;
  resolvedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface IssueStats {
  total: number;
  open: number;
  critical: number;
  resolved: number;
}

export interface SiteConditionLog {
  id: string;
  projectId?: string | null;
  date: string;
  weather: string;
  temperatureCelsius?: number | null;
  workersPresent?: number;
  machinesOperational?: number;
  workStatus: string;
  delayReason?: string;
  safetyIncidents?: number;
  notes?: string;
  loggedBy?: string | null;
  createdAt?: string | null;
}

export interface SiteConditionSummary {
  totalDaysLogged: number;
  totalWorkersDeployed: number;
  totalSafetyIncidents: number;
  haltedDays: number;
  delayedDays: number;
  weatherFrequency: Record<string, number>;
}

export interface ProjectSignoff {
  id: string;
  projectId?: string | null;
  signoffType: string;
  title: string;
  remarks?: string;
  signedBy?: string | null;
  signedAt?: string | null;
  attachmentUrl?: string | null;
  isPublic: boolean;
}

export const useProjectWorkspace = () => {
  const [announcements, setAnnouncements] = useState<Record<string, ProjectAnnouncement[]>>({});
  const [documents, setDocuments] = useState<Record<string, ProjectDocument[]>>({});
  const [timelineEvents, setTimelineEvents] = useState<Record<string, TimelineEvent[]>>({});
  const [milestoneAnalytics, setMilestoneAnalytics] = useState<Record<string, MilestoneAnalytics>>({});
  const [issuesByProject, setIssuesByProject] = useState<Record<string, ProjectIssue[]>>({});
  const [issueStatsByProject, setIssueStatsByProject] = useState<Record<string, IssueStats>>({});
  const [issueMetaByProject, setIssueMetaByProject] = useState<
    Record<string, { validSeverities: string[]; validStatuses: string[]; validTypes: string[] }>
  >({});
  const [siteConditionsByProject, setSiteConditionsByProject] = useState<Record<string, SiteConditionLog[]>>({});
  const [siteConditionSummaryByProject, setSiteConditionSummaryByProject] = useState<
    Record<string, { summary: SiteConditionSummary; validWeather: string[]; validWorkStatuses: string[] }>
  >({});
  const [signoffsByProject, setSignoffsByProject] = useState<Record<string, ProjectSignoff[]>>({});
  const [signoffMetaByProject, setSignoffMetaByProject] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await instance.get(`/announcements/project/${projectId}`);
      const items = (response.data?.data?.announcements ?? []) as ProjectAnnouncement[];
      setAnnouncements((current) => ({ ...current, [projectId]: items }));
      return items;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch announcements'));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createAnnouncement = useCallback(
    async (payload: { projectId: string; title: string; body: string; priority: string }) => {
      setLoading(true);
      setError(null);
      try {
        await instance.post('/announcements/', { payload });
        return await fetchAnnouncements(payload.projectId);
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to create the announcement'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchAnnouncements]
  );

  const fetchDocuments = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await instance.get(`/documents/project/${projectId}`);
      const items = (response.data?.data?.documents ?? []) as ProjectDocument[];
      setDocuments((current) => ({ ...current, [projectId]: items }));
      return items;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch project files'));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(
    async (payload: { projectId: string; file: File; tags?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('projectId', payload.projectId);
        formData.append('document', payload.file);
        if (payload.tags) formData.append('tags', payload.tags);
        await instance.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return await fetchDocuments(payload.projectId);
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to upload the document'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchDocuments]
  );

  const deleteDocument = useCallback(
    async (projectId: string, documentId: string) => {
      setLoading(true);
      setError(null);
      try {
        await instance.delete(`/documents/${documentId}`);
        return await fetchDocuments(projectId);
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to delete the document'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchDocuments]
  );

  const fetchTimeline = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await instance.get(`/timeline/project/${projectId}`);
      const items = (response.data?.data?.events ?? []) as TimelineEvent[];
      setTimelineEvents((current) => ({ ...current, [projectId]: items }));
      return {
        events: items,
        validEventTypes: (response.data?.data?.validEventTypes ?? []) as string[],
      };
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch the project timeline'));
      return { events: [], validEventTypes: [] as string[] };
    } finally {
      setLoading(false);
    }
  }, []);

  const createTimelineEvent = useCallback(
    async (payload: {
      projectId: string;
      title: string;
      eventType: string;
      eventDate: string;
      description: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        await instance.post('/timeline/', { payload });
        return await fetchTimeline(payload.projectId);
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to add the timeline event'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchTimeline]
  );

  const deleteTimelineEvent = useCallback(
    async (projectId: string, eventId: string) => {
      setLoading(true);
      setError(null);
      try {
        await instance.delete(`/timeline/${eventId}`);
        return await fetchTimeline(projectId);
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to delete the timeline event'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchTimeline]
  );

  const fetchMilestoneAnalytics = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await instance.get(`/ai/milestones/${projectId}`);
      const data = response.data?.data as MilestoneAnalytics;
      setMilestoneAnalytics((current) => ({ ...current, [projectId]: data }));
      return data;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch milestone analytics'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIssues = useCallback(
    async (
      projectId: string,
      filters?: { severity?: string; status?: string; issueType?: string }
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await instance.get(`/issues/project/${projectId}`, {
          params: {
            severity: filters?.severity || undefined,
            status: filters?.status || undefined,
            issueType: filters?.issueType || undefined,
          },
        });
        const issues = (response.data?.data?.issues ?? []) as ProjectIssue[];
        setIssuesByProject((current) => ({ ...current, [projectId]: issues }));
        setIssueStatsByProject((current) => ({
          ...current,
          [projectId]: (response.data?.data?.stats ?? {
            total: 0,
            open: 0,
            critical: 0,
            resolved: 0,
          }) as IssueStats,
        }));
        setIssueMetaByProject((current) => ({
          ...current,
          [projectId]: {
            validSeverities: (response.data?.data?.validSeverities ?? []) as string[],
            validStatuses: (response.data?.data?.validStatuses ?? []) as string[],
            validTypes: (response.data?.data?.validTypes ?? []) as string[],
          },
        }));
        return issues;
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to fetch issues'));
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createIssue = useCallback(
    async (payload: {
      projectId: string;
      title: string;
      description: string;
      severity: string;
      issueType: string;
      location: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        await instance.post('/issues/', { payload });
        return await fetchIssues(payload.projectId);
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to report the issue'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchIssues]
  );

  const updateIssueStatus = useCallback(
    async (
      projectId: string,
      issueId: string,
      payload: { status: string; assignedTo?: string; resolutionNote?: string }
    ) => {
      setLoading(true);
      setError(null);
      try {
        await instance.patch(`/issues/${issueId}/status`, payload);
        return await fetchIssues(projectId);
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to update issue status'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchIssues]
  );

  const fetchSiteConditions = useCallback(
    async (projectId: string, from?: string, to?: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await instance.get(`/site-conditions/project/${projectId}`, {
          params: { from, to },
        });
        const conditions = (response.data?.data?.conditions ?? []) as SiteConditionLog[];
        setSiteConditionsByProject((current) => ({ ...current, [projectId]: conditions }));
        setSiteConditionSummaryByProject((current) => ({
          ...current,
          [projectId]: {
            summary: (response.data?.data?.summary ?? {
              totalDaysLogged: 0,
              totalWorkersDeployed: 0,
              totalSafetyIncidents: 0,
              haltedDays: 0,
              delayedDays: 0,
              weatherFrequency: {},
            }) as SiteConditionSummary,
            validWeather: (response.data?.data?.validWeather ?? []) as string[],
            validWorkStatuses: (response.data?.data?.validWorkStatuses ?? []) as string[],
          },
        }));
        return conditions;
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to fetch site conditions'));
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createSiteCondition = useCallback(
    async (payload: {
      projectId: string;
      date: string;
      weather: string;
      temperatureCelsius?: number;
      workersPresent?: number;
      machinesOperational?: number;
      workStatus: string;
      delayReason?: string;
      safetyIncidents?: number;
      notes?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        await instance.post('/site-conditions/', { payload });
        return await fetchSiteConditions(payload.projectId);
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to log site conditions'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchSiteConditions]
  );

  const fetchSignoffs = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await instance.get(`/signoffs/project/${projectId}`);
      const signoffs = (response.data?.data?.signoffs ?? []) as ProjectSignoff[];
      setSignoffsByProject((current) => ({ ...current, [projectId]: signoffs }));
      setSignoffMetaByProject((current) => ({
        ...current,
        [projectId]: (response.data?.data?.validSignoffTypes ?? []) as string[],
      }));
      return signoffs;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch sign-offs'));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createSignoff = useCallback(
    async (payload: {
      projectId: string;
      signoffType: string;
      title: string;
      remarks?: string;
      isPublic?: boolean;
      attachmentUrl?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        await instance.post('/signoffs/', { payload });
        return await fetchSignoffs(payload.projectId);
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to create sign-off'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchSignoffs]
  );

  const fetchPublicSignoffs = useCallback(async (projectId: string) => {
    try {
      const response = await publicInstance.get(`/signoffs/project/${projectId}`);
      return (response.data?.data?.signoffs ?? []) as ProjectSignoff[];
    } catch {
      return [];
    }
  }, []);

  return {
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
    loading,
    error,
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
    fetchPublicSignoffs,
  };
};
