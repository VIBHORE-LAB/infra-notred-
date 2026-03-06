import { useState, useCallback } from "react";
import instance from "../api/api";

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
  createdAt?: string;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  title: string;
  description: string;
  updateType: string;
  attachments: string[];
  createdAt?: string;
}

export interface ProgressReport {
  id: string;
  projectId: string;
  description: string;
  images: string[];
  gpsCoordinates: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export interface CreateMilestonePayload {
  projectId: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  progress?: number;
  status?: string;
}

export interface CreateProjectUpdatePayload {
  projectId: string;
  title: string;
  description: string;
  updateType: string;
  attachments?: File[];
}

export interface CreateGalleryReportPayload {
  projectId: string;
  latitude: string;
  longitude: string;
  description: string;
  images: File[];
}

const COMPANY_CODE_KEY = "companyCode";

function getHeaders() {
  const companyCode = localStorage.getItem(COMPANY_CODE_KEY) ?? "";
  return { "x-company-code": companyCode };
}

export const useMilestones = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([]);
  const [progressReports, setProgressReports] = useState<ProgressReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMilestonesByProject = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.get(`/milestones/project/${projectId}`, {
        headers: getHeaders(),
      });
      const list = res.data?.data?.milestones as Milestone[];
      setMilestones(list ?? []);
      return list ?? [];
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to fetch milestones");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjectUpdatesByProject = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.get(`/project-updates/project/${projectId}`, {
        headers: getHeaders(),
      });
      const list = res.data?.data?.updates as ProjectUpdate[];
      setProjectUpdates(list ?? []);
      return list ?? [];
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to fetch project updates");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReportsByProject = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.get(`/progress-reports/project/${projectId}`, {
        headers: getHeaders(),
      });
      const list = res.data?.data?.reports as ProgressReport[];
      setProgressReports(list ?? []);
      return list ?? [];
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to fetch progress reports");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createMilestone = useCallback(async (payload: CreateMilestonePayload) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await instance.post(
        "/milestones/create",
        { req: { signature: "create_milestone" }, payload },
        { headers: getHeaders() }
      );
      return res.data?.data;
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to create milestone");
      return null;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const createProjectUpdate = useCallback(async (payload: CreateProjectUpdatePayload) => {
    setActionLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("req", JSON.stringify({ signature: "create_project_update" }));
      formData.append(
        "payload",
        JSON.stringify({
          projectId: payload.projectId,
          title: payload.title,
          description: payload.description,
          updateType: payload.updateType,
        })
      );
      (payload.attachments ?? []).forEach((file) => formData.append("attachments", file));

      const res = await instance.post("/project-updates/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...getHeaders(),
        },
      });
      return res.data?.data;
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to create project update");
      return null;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const createGalleryReport = useCallback(async (payload: CreateGalleryReportPayload) => {
    setActionLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("projectId", payload.projectId);
      formData.append("latitude", payload.latitude);
      formData.append("longitude", payload.longitude);
      formData.append("description", payload.description);
      payload.images.forEach((file) => formData.append("images", file));

      const res = await instance.post("/progress-reports/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...getHeaders(),
        },
      });
      return res.data?.data;
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to upload site gallery images");
      return null;
    } finally {
      setActionLoading(false);
    }
  }, []);

  return {
    milestones,
    projectUpdates,
    progressReports,
    loading,
    actionLoading,
    error,
    fetchMilestonesByProject,
    fetchProjectUpdatesByProject,
    fetchReportsByProject,
    createMilestone,
    createProjectUpdate,
    createGalleryReport,
  };
};
