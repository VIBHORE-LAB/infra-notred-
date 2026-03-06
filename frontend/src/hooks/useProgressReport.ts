import { useCallback, useState } from "react";
import instance from "../api/api";

export interface ProgressReport {
  _id: string;
  projectId: string;
  uploadedBy: string;
  gpsCoordinates: {
    latitude: number;
    longitude: number;
  };
  description: string;
  images: string[];
  timestamp?: string;
  projectName?: string;
  projectDescription?: string;
}

const COMPANY_CODE_KEY = "companyCode";

function getHeaders() {
  const companyCode = localStorage.getItem(COMPANY_CODE_KEY) ?? "";
  return { "x-company-code": companyCode };
}

export const useProgressReport = () => {
  const [submitLoading, setSubmitLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReport = useCallback(async (projectId: string, latitude: string, longitude: string, description: string, files: FileList | File[]) => {
    setSubmitLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      formData.append("description", description);
      
      Array.from(files).forEach((file) => {
        formData.append("images", file);
      });

      const response = await instance.post("/progress-reports/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...getHeaders(),
        }
      });
      return response.data?.data;
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Error submitting progress report";
      setError(errMsg);
      return null;
    } finally {
      setSubmitLoading(false);
    }
  }, []);

  const getReportsByProject = useCallback(async (projectId: string) => {
    setReportsLoading(true);
    setError(null);
    try {
      const response = await instance.get(`/progress-reports/project/${projectId}`, { headers: getHeaders() });
      return (response.data?.data?.reports ?? []) as ProgressReport[];
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Error fetching project reports";
      setError(errMsg);
      return [];
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const getAllReports = useCallback(async () => {
    setReportsLoading(true);
    setError(null);
    try {
      const response = await instance.get("/progress-reports/all", { headers: getHeaders() });
      return (response.data?.data?.reports ?? []) as ProgressReport[];
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Error fetching reports";
      setError(errMsg);
      return [];
    } finally {
      setReportsLoading(false);
    }
  }, []);

  return { submitReport, getReportsByProject, getAllReports, submitLoading, reportsLoading, error };
};
