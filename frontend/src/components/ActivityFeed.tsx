import React, { useEffect, useMemo } from 'react';
import { Activity, Building2, FolderClock } from 'lucide-react';
import { formatDate } from '@/helpers/date';
import { useActivity } from '@/hooks/useActivity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ActivityFeedProps {
  projectId?: string;
  companyWide?: boolean;
  title?: string;
  description?: string;
}

const humanizeAction = (action: string) =>
  action
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const summarizeMeta = (meta?: Record<string, unknown>) => {
  if (!meta) return null;
  const entries = Object.entries(meta).filter(([, value]) => value !== null && value !== undefined && value !== '');
  if (entries.length === 0) return null;
  return entries
    .slice(0, 2)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' • ');
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  projectId,
  companyWide = false,
  title,
  description,
}) => {
  const { companyLogs, projectLogs, loading, fetchCompanyActivity, fetchProjectActivity } = useActivity();

  useEffect(() => {
    if (companyWide) {
      void fetchCompanyActivity(1, 20);
      return;
    }
    if (projectId) {
      void fetchProjectActivity(projectId);
    }
  }, [companyWide, fetchCompanyActivity, fetchProjectActivity, projectId]);

  const logs = useMemo(() => {
    if (companyWide) return companyLogs;
    return projectId ? projectLogs[projectId] ?? [] : [];
  }, [companyLogs, companyWide, projectId, projectLogs]);

  return (
    <Card className="border-border/80">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title ?? (companyWide ? 'Company activity' : 'Project activity')}</CardTitle>
            <CardDescription>
              {description ??
                (companyWide
                  ? 'Recent actions across your company workspace.'
                  : 'Recent actions connected to this project.')}
            </CardDescription>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
            {companyWide ? <Building2 className="h-4 w-4" /> : <FolderClock className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && logs.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
            No activity has been recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="relative pl-6">
                <div className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Activity className="h-3 w-3" />
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-foreground">
                      {log.actorName || 'Team member'}{' '}
                      <span className="text-muted-foreground">{humanizeAction(log.action)}</span>
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(log.createdAt, 'No date')}
                    </span>
                  </div>
                  {summarizeMeta(log.meta) && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {summarizeMeta(log.meta)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
