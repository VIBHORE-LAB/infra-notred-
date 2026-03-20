import { useCallback, useState } from 'react';
import instance, { getApiErrorMessage } from '@/api/api';

export interface ActivityLog {
  id: string;
  actorId?: string | null;
  actorName: string;
  action: string;
  companyCode?: string;
  projectId?: string | null;
  meta?: Record<string, unknown>;
  createdAt?: string | null;
}

export const useActivity = () => {
  const [projectLogs, setProjectLogs] = useState<Record<string, ActivityLog[]>>({});
  const [companyLogs, setCompanyLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectActivity = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await instance.get(`/activity/project/${projectId}`);
      const logs = (response.data?.data?.logs ?? []) as ActivityLog[];
      setProjectLogs((current) => ({ ...current, [projectId]: logs }));
      return logs;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch project activity'));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCompanyActivity = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    setError(null);
    try {
      const response = await instance.get('/activity/company', {
        params: { page, limit },
      });
      const logs = (response.data?.data?.logs ?? []) as ActivityLog[];
      setCompanyLogs(logs);
      return logs;
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch company activity'));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    projectLogs,
    companyLogs,
    loading,
    error,
    fetchProjectActivity,
    fetchCompanyActivity,
  };
};
