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
  companyCode: string;
}

const COMPANY_CODE_KEY = "companyCode";

function getHeaders() {
  const companyCode = localStorage.getItem(COMPANY_CODE_KEY) ?? "";
  return { "x-company-code": companyCode };
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
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

  return { projects, setProjects, loading, error, fetchProject, fetchAllProjects, createProject, addAdmin };
};
