import { useCallback, useState } from 'react';
import instance from '../api/api';

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
  location: { city: string; state: string; country?: string; zipCode?: string; areaInSqFt?: number };
  funding: { estimatedBudget: number; totalAllocated: number; totalSpent: number; utilizationPercent: number };
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

const PUBLIC_USER_ID_KEY = 'publicUserId';

function getPublicUserId() {
  let id = localStorage.getItem(PUBLIC_USER_ID_KEY);
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `public-${Date.now()}-${Math.random()}`;
    localStorage.setItem(PUBLIC_USER_ID_KEY, id);
  }
  return id;
}

function getPublicHeaders() {
  return { 'x-public-user-id': getPublicUserId() };
}

function getApiErrorMessage(err: any, fallback: string) {
  if (err?.response?.data?.error) return err.response.data.error as string;
  if (err?.response?.status) return `${fallback} (HTTP ${err.response.status})`;
  if (err?.message) return `${fallback}: ${err.message}`;
  return fallback;
}

export const usePublicPortal = () => {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [projectDetails, setProjectDetails] = useState<Record<string, PublicProjectDetail>>({});
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingProjectDetail, setLoadingProjectDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    setError(null);
    try {
      const res = await instance.get('/public/projects', { headers: getPublicHeaders() });
      const data = (res.data?.data?.projects ?? []) as PublicProject[];
      setProjects(data);
      return data;
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Failed to fetch public projects'));
      return [];
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const fetchProjectDetail = useCallback(async (projectId: string) => {
    setLoadingProjectDetail(true);
    setError(null);
    try {
      const res = await instance.get(`/public/projects/${projectId}`, { headers: getPublicHeaders() });
      const detail = res.data?.data as PublicProjectDetail;
      if (detail?.project?.id) {
        setProjectDetails((prev) => ({ ...prev, [detail.project.id]: detail }));
        setProjects((prev) => prev.map((item) => (item.id === detail.project.id ? { ...item, ...detail.project } : item)));
      }
      return detail;
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Failed to fetch project thread'));
      return null;
    } finally {
      setLoadingProjectDetail(false);
    }
  }, []);

  const addProjectComment = useCallback(async (projectId: string, payload: { content: string; authorName: string }) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await instance.post(`/public/projects/${projectId}/comments`, payload, { headers: getPublicHeaders() });
      const forum = res.data?.data?.forum as ProjectForum;
      if (forum) {
        setProjectDetails((prev) => {
          const current = prev[projectId];
          if (!current) return prev;
          return {
            ...prev,
            [projectId]: {
              ...current,
              forum,
              project: { ...current.project, commentCount: forum.commentCount },
            },
          };
        });
        setProjects((prev) => prev.map((item) => (item.id === projectId ? { ...item, commentCount: forum.commentCount } : item)));
      }
      return forum;
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Failed to add comment'));
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const voteProjectThread = useCallback(async (projectId: string, voteType: 'up' | 'down') => {
    setSubmitting(true);
    setError(null);
    const userId = getPublicUserId();

    try {
      const res = await instance.post(
        `/public/projects/${projectId}/vote`,
        { voteType, userId },
        { headers: getPublicHeaders() },
      );
      const forum = res.data?.data?.forum as ProjectForum;
      if (forum) {
        setProjectDetails((prev) => {
          const current = prev[projectId];
          if (!current) return prev;
          return {
            ...prev,
            [projectId]: {
              ...current,
              forum,
              project: {
                ...current.project,
                upvoteCount: forum.upvoteCount,
                downvoteCount: forum.downvoteCount,
                voteScore: forum.voteScore,
                userVote: forum.userVote,
              },
            },
          };
        });
        setProjects((prev) =>
          prev.map((item) =>
            item.id === projectId
              ? {
                  ...item,
                  upvoteCount: forum.upvoteCount,
                  downvoteCount: forum.downvoteCount,
                  voteScore: forum.voteScore,
                  userVote: forum.userVote,
                }
              : item,
          ),
        );
      }
      return forum;
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Failed to update vote'));
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    projects,
    projectDetails,
    loadingProjects,
    loadingProjectDetail,
    submitting,
    error,
    fetchProjects,
    fetchProjectDetail,
    addProjectComment,
    voteProjectThread,
  };
};
