import { useCallback, useRef, useState } from 'react';
import {
  getApiErrorMessage,
  getPublicHeaders,
  getPublicUserId,
  publicInstance,
} from '@/api/api';

export interface PublicProject {
  id: string;
  name: string;
  description: string;
  status: string;
  projectType?: string;
  teamsize?: number;
  commentCount?: number;
  upvoteCount?: number;
  downvoteCount?: number;
  voteScore?: number;
  userVote?: 'up' | 'down' | null;
  averageRating?: number;
  totalRatings?: number;
  savedAt?: string;
  location: {
    city: string;
    state: string;
    country?: string;
    zipCode?: string;
    areaInSqFt?: number;
    latitude?: number;
    longitude?: number;
  };
  funding: {
    estimatedBudget: number;
    totalAllocated: number;
    totalSpent: number;
    utilizationPercent: number;
  };
  timeline: { startDate: string; endDate: string; deadline: string };
}

export interface ProjectComment {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface ProjectForum {
  projectId: string;
  commentCount: number;
  comments: ProjectComment[];
  upvoteCount: number;
  downvoteCount: number;
  voteScore: number;
  userVote: 'up' | 'down' | null;
}

export interface PublicProjectDetail {
  project: PublicProject;
  forum: ProjectForum;
}

export interface PublicAnnouncement {
  id: string;
  title: string;
  body: string;
  priority: 'Critical' | 'Urgent' | 'Normal' | string;
  postedBy?: string | null;
  createdAt?: string | null;
}

export interface ProjectRatings {
  projectId: string;
  averageRating: number;
  totalRatings: number;
  distribution: Record<string, number>;
  sentimentBreakdown: Record<string, number>;
  validSentimentTags: string[];
}

export interface DiscussionReply {
  id: string;
  body: string;
  authorName: string;
  upvoteCount: number;
  createdAt?: string | null;
}

export interface DiscussionThread {
  id: string;
  projectId?: string | null;
  title: string;
  body: string;
  authorName: string;
  upvoteCount: number;
  replies: DiscussionReply[];
  replyCount: number;
  createdAt?: string | null;
}

export interface HeatmapPoint {
  id: string;
  name: string;
  status: string;
  projectType: string;
  latitude: number;
  longitude: number;
  estimatedBudget: number;
  totalSpent: number;
  budgetPressure: number;
  city: string;
}

export interface PublicSearchFilters {
  q?: string;
  city?: string;
  status?: string;
  projectType?: string;
  minBudget?: number;
  maxBudget?: number;
  sortBy?: 'date' | 'budget' | 'votes';
  page?: number;
  limit?: number;
}

export interface PublicSearchMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WatcherState {
  projectId: string;
  totalWatchers: number;
  isWatching: boolean;
}

export interface PublicGalleryImage {
  url: string;
  reportId: string;
  projectId?: string;
  projectName?: string;
  description?: string;
  timestamp?: string | null;
  location?: {
    latitude?: number | null;
    longitude?: number | null;
  };
}

export interface GalleryResponse {
  projectId?: string;
  projectName?: string;
  companyCode?: string;
  gallery: PublicGalleryImage[];
  totalImages?: number;
  total?: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PublicSignoff {
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

export const usePublicPortal = () => {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [savedProjects, setSavedProjects] = useState<PublicProject[]>([]);
  const [projectDetails, setProjectDetails] = useState<Record<string, PublicProjectDetail>>({});
  const [ratingsByProject, setRatingsByProject] = useState<Record<string, ProjectRatings>>({});
  const [announcementsByProject, setAnnouncementsByProject] = useState<Record<string, PublicAnnouncement[]>>({});
  const [threadsByProject, setThreadsByProject] = useState<Record<string, DiscussionThread[]>>({});
  const [watchersByProject, setWatchersByProject] = useState<Record<string, WatcherState>>({});
  const [projectGalleryByProject, setProjectGalleryByProject] = useState<Record<string, GalleryResponse>>({});
  const [companyGallery, setCompanyGallery] = useState<GalleryResponse | null>(null);
  const [publicSignoffsByProject, setPublicSignoffsByProject] = useState<Record<string, PublicSignoff[]>>({});
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [searchMeta, setSearchMeta] = useState<PublicSearchMeta>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingProjectDetail, setLoadingProjectDetail] = useState(false);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [loadingSavedProjects, setLoadingSavedProjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ratingRequests = useRef<Record<string, Promise<ProjectRatings | null> | null>>({});

  const searchProjects = useCallback(async (filters: PublicSearchFilters = {}) => {
    setLoadingProjects(true);
    setError(null);
    try {
      const params = {
        q: filters.q ?? '',
        city: filters.city ?? '',
        status: filters.status ?? '',
        projectType: filters.projectType ?? '',
        minBudget: filters.minBudget,
        maxBudget: filters.maxBudget,
        sortBy: filters.sortBy ?? 'date',
        page: filters.page ?? 1,
        limit: filters.limit ?? 12,
      };
      const response = await publicInstance.get('/public/projects/search', {
        params,
        headers: getPublicHeaders(),
      });
      const list = (response.data?.data?.projects ?? []) as PublicProject[];
      setProjects(list);
      setSearchMeta({
        total: response.data?.data?.total ?? list.length,
        page: response.data?.data?.page ?? params.page,
        limit: response.data?.data?.limit ?? params.limit,
        totalPages: response.data?.data?.totalPages ?? 1,
      });
      return list;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to search public projects'));
      return [];
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    return searchProjects({ page: 1, limit: 12, sortBy: 'date' });
  }, [searchProjects]);

  const fetchProjectDetail = useCallback(async (projectId: string) => {
    setLoadingProjectDetail(true);
    setError(null);
    try {
      const response = await publicInstance.get(`/public/projects/${projectId}`, {
        headers: getPublicHeaders(),
      });
      const detail = response.data?.data as PublicProjectDetail;
      if (detail?.project?.id) {
        setProjectDetails((current) => ({ ...current, [detail.project.id]: detail }));
      }
      return detail;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch project detail'));
      return null;
    } finally {
      setLoadingProjectDetail(false);
    }
  }, []);

  const addProjectComment = useCallback(
    async (projectId: string, payload: { content: string; authorName: string }) => {
      setSubmitting(true);
      setError(null);
      try {
        const response = await publicInstance.post(`/public/projects/${projectId}/comments`, payload, {
          headers: getPublicHeaders(),
        });
        const forum = response.data?.data?.forum as ProjectForum;
        if (forum) {
          setProjectDetails((current) => {
            const existing = current[projectId];
            if (!existing) return current;
            return {
              ...current,
              [projectId]: {
                ...existing,
                forum,
                project: {
                  ...existing.project,
                  commentCount: forum.commentCount,
                },
              },
            };
          });
        }
        return forum;
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to add comment'));
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  const voteProjectThread = useCallback(async (projectId: string, voteType: 'up' | 'down') => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await publicInstance.post(
        `/public/projects/${projectId}/vote`,
        { voteType, userId: getPublicUserId() },
        { headers: getPublicHeaders() }
      );
      const forum = response.data?.data?.forum as ProjectForum;
      if (forum) {
        setProjectDetails((current) => {
          const existing = current[projectId];
          if (!existing) return current;
          return {
            ...current,
            [projectId]: {
              ...existing,
              forum,
              project: {
                ...existing.project,
                upvoteCount: forum.upvoteCount,
                downvoteCount: forum.downvoteCount,
                voteScore: forum.voteScore,
                userVote: forum.userVote,
              },
            },
          };
        });
      }
      return forum;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to update the project vote'));
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const fetchProjectRatings = useCallback(async (projectId: string, options?: { force?: boolean }) => {
    if (!options?.force && ratingsByProject[projectId]) {
      return ratingsByProject[projectId];
    }

    if (!options?.force && ratingRequests.current[projectId]) {
      return ratingRequests.current[projectId];
    }

    setLoadingRatings(true);
    setError(null);
    const requestPromise = (async () => {
      try {
        const response = await publicInstance.get(`/public/projects/${projectId}/ratings`, {
          headers: getPublicHeaders(),
        });
        const ratings = response.data?.data as ProjectRatings;
        if (ratings?.projectId) {
          setRatingsByProject((current) => ({ ...current, [projectId]: ratings }));
        }
        return ratings;
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to fetch project ratings'));
        return null;
      } finally {
        ratingRequests.current[projectId] = null;
        setLoadingRatings(false);
      }
    })();

    ratingRequests.current[projectId] = requestPromise;
    return requestPromise;
  }, [ratingsByProject]);

  const rateProject = useCallback(
    async (projectId: string, payload: { stars: number; sentimentTag?: string }) => {
      setSubmitting(true);
      setError(null);
      try {
        const response = await publicInstance.post(
          `/public/projects/${projectId}/rate`,
          { ...payload, userId: getPublicUserId() },
          { headers: getPublicHeaders() }
        );
        const data = response.data?.data as ProjectRatings & { yourRating?: number };
        if (data?.projectId) {
          setRatingsByProject((current) => ({ ...current, [projectId]: data }));
        }
        setProjects((current) =>
          current.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  averageRating: data?.averageRating ?? project.averageRating,
                  totalRatings: data?.totalRatings ?? project.totalRatings,
                }
              : project
          )
        );
        setProjectDetails((current) => {
          const existing = current[projectId];
          if (!existing) return current;
          return {
            ...current,
            [projectId]: {
              ...existing,
              project: {
                ...existing.project,
                averageRating: data?.averageRating ?? existing.project.averageRating,
                totalRatings: data?.totalRatings ?? existing.project.totalRatings,
              },
            },
          };
        });
        return data;
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to submit the rating'));
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  const fetchAnnouncements = useCallback(async (projectId: string) => {
    setError(null);
    try {
      const response = await publicInstance.get(`/announcements/project/${projectId}`);
      const announcements = (response.data?.data?.announcements ?? []) as PublicAnnouncement[];
      setAnnouncementsByProject((current) => ({ ...current, [projectId]: announcements }));
      return announcements;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch announcements'));
      return [];
    }
  }, []);

  const fetchThreads = useCallback(async (projectId: string) => {
    setError(null);
    try {
      const response = await publicInstance.get(`/discussions/project/${projectId}`, {
        headers: getPublicHeaders(),
      });
      const threads = (response.data?.data?.threads ?? []) as DiscussionThread[];
      setThreadsByProject((current) => ({ ...current, [projectId]: threads }));
      return threads;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch discussion threads'));
      return [];
    }
  }, []);

  const createThread = useCallback(
    async (projectId: string, payload: { title: string; body: string; authorName: string }) => {
      setSubmitting(true);
      setError(null);
      try {
        await publicInstance.post(`/discussions/project/${projectId}/thread`, payload, {
          headers: getPublicHeaders(),
        });
        return await fetchThreads(projectId);
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to create the thread'));
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [fetchThreads]
  );

  const replyToThread = useCallback(
    async (projectId: string, threadId: string, payload: { body: string; authorName: string }) => {
      setSubmitting(true);
      setError(null);
      try {
        const response = await publicInstance.post(`/discussions/thread/${threadId}/reply`, payload, {
          headers: getPublicHeaders(),
        });
        const updatedThread = response.data?.data?.thread as DiscussionThread;
        if (updatedThread) {
          setThreadsByProject((current) => ({
            ...current,
            [projectId]: (current[projectId] ?? []).map((thread) =>
              thread.id === updatedThread.id ? updatedThread : thread
            ),
          }));
        }
        return updatedThread;
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to reply to the thread'));
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  const upvoteDiscussionThread = useCallback(async (projectId: string, threadId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await publicInstance.post(
        `/discussions/thread/${threadId}/upvote`,
        { userId: getPublicUserId() },
        { headers: getPublicHeaders() }
      );
      const updatedThread = response.data?.data?.thread as DiscussionThread;
      if (updatedThread) {
        setThreadsByProject((current) => ({
          ...current,
          [projectId]: (current[projectId] ?? []).map((thread) =>
            thread.id === updatedThread.id ? updatedThread : thread
          ),
        }));
      }
      return updatedThread;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to update thread votes'));
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const upvoteDiscussionReply = useCallback(
    async (projectId: string, threadId: string, replyId: string) => {
      setSubmitting(true);
      setError(null);
      try {
        const response = await publicInstance.post(
          `/discussions/thread/${threadId}/reply/${replyId}/upvote`,
          { userId: getPublicUserId() },
          { headers: getPublicHeaders() }
        );
        const updatedThread = response.data?.data?.thread as DiscussionThread;
        if (updatedThread) {
          setThreadsByProject((current) => ({
            ...current,
            [projectId]: (current[projectId] ?? []).map((thread) =>
              thread.id === updatedThread.id ? updatedThread : thread
            ),
          }));
        }
        return updatedThread;
      } catch (error: any) {
        setError(getApiErrorMessage(error, 'Failed to update reply votes'));
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  const fetchHeatmapPoints = useCallback(async () => {
    setLoadingHeatmap(true);
    setError(null);
    try {
      const response = await publicInstance.get('/public/heatmap');
      const points = (response.data?.data?.heatmapPoints ?? []) as HeatmapPoint[];
      setHeatmapPoints(points);
      return points;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch heatmap data'));
      return [];
    } finally {
      setLoadingHeatmap(false);
    }
  }, []);

  const fetchWatchers = useCallback(async (projectId: string) => {
    setError(null);
    try {
      const response = await publicInstance.get(`/watchlist/projects/${projectId}/watchers`, {
        headers: getPublicHeaders(),
      });
      const state = response.data?.data as WatcherState;
      if (state?.projectId) {
        setWatchersByProject((current) => ({ ...current, [projectId]: state }));
      }
      return state;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch watchers'));
      return null;
    }
  }, []);

  const toggleWatchlist = useCallback(async (projectId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await publicInstance.post(
        `/watchlist/projects/${projectId}/watch`,
        { userId: getPublicUserId() },
        { headers: getPublicHeaders() }
      );
      const state = response.data?.data as WatcherState;
      if (state?.projectId) {
        setWatchersByProject((current) => ({ ...current, [projectId]: state }));
      }
      return state;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to update watchlist'));
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const fetchSavedProjects = useCallback(async (userId = getPublicUserId()) => {
    setLoadingSavedProjects(true);
    setError(null);
    try {
      const response = await publicInstance.get(`/watchlist/user/${userId}`, {
        headers: getPublicHeaders(),
      });
      const list = (response.data?.data?.savedProjects ?? []) as PublicProject[];
      setSavedProjects(list);
      return list;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch saved projects'));
      return [];
    } finally {
      setLoadingSavedProjects(false);
    }
  }, []);

  const fetchProjectGallery = useCallback(async (projectId: string, page = 1, limit = 24) => {
    setLoadingGallery(true);
    setError(null);
    try {
      const response = await publicInstance.get(`/gallery/projects/${projectId}`, {
        params: { page, limit },
      });
      const data = {
        projectId: response.data?.data?.projectId as string | undefined,
        projectName: response.data?.data?.projectName as string | undefined,
        gallery: (response.data?.data?.gallery ?? []) as PublicGalleryImage[],
        totalImages: response.data?.data?.totalImages as number | undefined,
        page: response.data?.data?.page ?? page,
        limit: response.data?.data?.limit ?? limit,
        totalPages: response.data?.data?.totalPages ?? 1,
      } satisfies GalleryResponse;
      setProjectGalleryByProject((current) => ({ ...current, [projectId]: data }));
      return data;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch project gallery'));
      return null;
    } finally {
      setLoadingGallery(false);
    }
  }, []);

  const fetchCompanyGallery = useCallback(async (companyCode: string, page = 1, limit = 24) => {
    setLoadingGallery(true);
    setError(null);
    try {
      const response = await publicInstance.get('/gallery/company', {
        params: { companyCode, page, limit },
      });
      const data = {
        companyCode,
        gallery: (response.data?.data?.gallery ?? []) as PublicGalleryImage[],
        total: response.data?.data?.total ?? 0,
        page: response.data?.data?.page ?? page,
        limit: response.data?.data?.limit ?? limit,
        totalPages: response.data?.data?.totalPages ?? 1,
      } satisfies GalleryResponse;
      setCompanyGallery(data);
      return data;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch company gallery'));
      return null;
    } finally {
      setLoadingGallery(false);
    }
  }, []);

  const fetchPublicSignoffs = useCallback(async (projectId: string) => {
    setError(null);
    try {
      const response = await publicInstance.get(`/signoffs/project/${projectId}`);
      const signoffs = (response.data?.data?.signoffs ?? []) as PublicSignoff[];
      setPublicSignoffsByProject((current) => ({ ...current, [projectId]: signoffs }));
      return signoffs;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch sign-offs'));
      return [];
    }
  }, []);

  return {
    projects,
    savedProjects,
    projectDetails,
    ratingsByProject,
    announcementsByProject,
    threadsByProject,
    watchersByProject,
    projectGalleryByProject,
    companyGallery,
    publicSignoffsByProject,
    heatmapPoints,
    searchMeta,
    loadingProjects,
    loadingProjectDetail,
    loadingRatings,
    loadingHeatmap,
    loadingGallery,
    loadingSavedProjects,
    submitting,
    error,
    fetchProjects,
    searchProjects,
    fetchProjectDetail,
    addProjectComment,
    voteProjectThread,
    fetchProjectRatings,
    rateProject,
    fetchAnnouncements,
    fetchThreads,
    createThread,
    replyToThread,
    upvoteDiscussionThread,
    upvoteDiscussionReply,
    fetchHeatmapPoints,
    fetchWatchers,
    toggleWatchlist,
    fetchSavedProjects,
    fetchProjectGallery,
    fetchCompanyGallery,
    fetchPublicSignoffs,
  };
};
