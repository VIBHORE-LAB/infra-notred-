import { useState, useCallback } from "react";
import instance from "../api/api";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  location: {
    city: string;
    state: string;
    country: string;
    zipCode: string;
    areaInSqFt: number;
    latitude?: number;
    longitude?: number;
  };
  funding: {
    estimatedBudget: number;
    totalAllocated: number;
    totalSpent: number;
    utilizationPercent: number;
    fundingSource: string;
  };
  timeline: {
    startDate: string;
    endDate: string;
    deadline: string;
  };
  projectType?: string;
  teamsize: number;
  companyCode?: string;
  users?: Array<{ id?: string; role?: string; name?: string }>;
  tags?: string[];
}

const COMPANY_CODE_KEY = "companyCode";

function getHeaders() {
  const companyCode = localStorage.getItem(COMPANY_CODE_KEY) ?? "";
  return { "x-company-code": companyCode };
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET project by ID
  const fetchProject = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.get(`/projects/${projectId}`, { headers: getHeaders() });
      return res.data?.data?.project as Project;
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to fetch project");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // GET all projects for the company
  const fetchAllProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.get("/projects/", { headers: getHeaders() });
      const list = res.data?.data?.projects as Project[];
      setProjects(list ?? []);
      return list ?? [];
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to fetch projects");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);


  // POST create project (owner only)
  const createProject = useCallback(async (payload: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.post(
        "/projects/create",
        { req: { signature: "create_project" }, payload },
        { headers: getHeaders() }
      );
      return res.data?.data?.project as Project;
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to create project");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // POST add admin to project
  const addAdmin = useCallback(async (projectId: string, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.post(
        "/projects/addAdmin",
        { req: { signature: "add_admin_to_project" }, payload: { projectId, userId } },
        { headers: getHeaders() }
      );
      return res.data?.data?.admin;
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to add admin");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addTags = useCallback(async (projectId: string, tags: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.post(`/projects/${projectId}/tags`, { tags }, { headers: getHeaders() });
      return res.data?.data?.tags as string[];
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to add tags");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeTag = useCallback(async (projectId: string, tag: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.delete(`/projects/${projectId}/tags`, {
        headers: getHeaders(),
        data: { tag },
      });
      return res.data?.data?.tags as string[];
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to remove tag");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjectsByTag = useCallback(async (tag: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.get(`/projects/by-tag`, {
        headers: getHeaders(),
        params: { tag },
      });
      return (res.data?.data?.projects ?? []) as Project[];
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to fetch projects by tag");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.get(`/projects/tags`, { headers: getHeaders() });
      const tags = (res.data?.data?.tags ?? []) as string[];
      setAvailableTags(tags);
      return tags;
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to fetch available tags");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkAddTags = useCallback(async (projectIds: string[], tags: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.post(
        `/projects/bulk-tags`,
        { payload: { projectIds, tags } },
        { headers: getHeaders() }
      );
      return res.data?.data as {
        updatedCount: number;
        matchedCount: number;
        tags: string[];
        projects: Record<string, string[]>;
      };
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to update project tags");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdateStatus = useCallback(async (projectIds: string[], status: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.post(
        `/projects/bulk-status`,
        { payload: { projectIds, status } },
        { headers: getHeaders() }
      );
      return res.data?.data as {
        updatedCount: number;
        matchedCount: number;
        newStatus: string;
      };
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to update project statuses");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    projects,
    setProjects,
    availableTags,
    loading,
    error,
    fetchProject,
    fetchAllProjects,
    createProject,
    addAdmin,
    addTags,
    removeTag,
    fetchAvailableTags,
    fetchProjectsByTag,
    bulkAddTags,
    bulkUpdateStatus,
  };
};
