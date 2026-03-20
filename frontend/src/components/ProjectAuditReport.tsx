import React from 'react';
import { Project } from '../hooks/useProjects';
import { formatDate } from '../helpers';
import { formatCurrency, riskToneClass, statusToneClass } from '@/lib/presentation';

interface ProjectAuditReportProps {
  project: Project;
  milestones: Array<{
    title: string;
    progress?: number;
  }>;
  updates: Array<{
    title: string;
    description: string;
    createdAt?: string;
  }>;
  prediction: {
    riskLevel?: string;
    confidenceScore?: number;
    delayReasoning?: string;
  } | null;
  runwayInfo: {
    daysLeft?: number;
    exhaustedDate?: Date | null;
  } | null;
}

const ProjectAuditReport: React.FC<ProjectAuditReportProps> = ({
  project,
  milestones,
  updates,
  prediction,
  runwayInfo,
}) => {
  const reportId = `AUDIT-${project.id?.slice(-6).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-4xl rounded-[28px] border border-border bg-card p-8 text-card-foreground shadow-[0_28px_90px_rgba(15,23,42,0.14)] print:max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none">
      <header className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Delivery audit summary
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            Project audit report
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Consolidated schedule, funding, and recent field activity for the selected project.
          </p>
        </div>

        <div className="soft-panel min-w-[220px]">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Generated</p>
          <p className="mt-2 text-sm font-medium text-foreground">{formatDate(new Date())}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Report ID</p>
          <p className="mt-2 text-sm font-medium text-foreground">{reportId}</p>
        </div>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Project</p>
          <p className="mt-2 font-semibold text-foreground">{project.name}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Location</p>
          <p className="mt-2 font-semibold text-foreground">
            {[project.location?.city, project.location?.state].filter(Boolean).join(', ') || 'Not specified'}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</p>
          <div className="mt-2">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${statusToneClass(project.status)}`}>
              {project.status}
            </span>
          </div>
        </div>
        <div className="metric-card">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Forecast tone</p>
          <div className="mt-2">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${riskToneClass(prediction?.riskLevel)}`}>
              {prediction?.riskLevel || 'Pending'}
            </span>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="page-section">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="section-title">Delivery outlook</h2>
                <p className="section-copy mt-1">
                  Current schedule pressure, confidence level, and operating context.
                </p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${riskToneClass(prediction?.riskLevel)}`}>
                {prediction?.riskLevel || 'Pending'}
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="soft-panel">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Confidence</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {Math.round((prediction?.confidenceScore || 0) * 100)}%
                </p>
              </div>
              <div className="soft-panel">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Runway</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {runwayInfo?.daysLeft === Infinity ? 'Stable' : `${runwayInfo?.daysLeft ?? 'N/A'} days`}
                </p>
              </div>
            </div>

            <div className="soft-panel">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Summary</p>
              <p className="mt-3 text-sm leading-7 text-foreground">
                {prediction?.delayReasoning ||
                  'The current project inputs do not yet provide a detailed forward-looking summary.'}
              </p>
            </div>
          </div>

          <div className="page-section">
            <h2 className="section-title">Recent milestones</h2>
            <div className="mt-5 space-y-3">
              {milestones.length > 0 ? (
                milestones.slice(0, 4).map((milestone, index) => (
                  <div key={`${milestone.title}-${index}`} className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                    <span className="font-medium text-foreground">{milestone.title}</span>
                    <span className="text-sm text-muted-foreground">{milestone.progress ?? 0}%</span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  No milestones were recorded for this report window.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="page-section">
            <h2 className="section-title">Funding posture</h2>
            <div className="mt-5 grid gap-4">
              <div className="metric-card">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Estimated budget</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {formatCurrency(project.funding?.estimatedBudget)}
                </p>
              </div>
              <div className="metric-card">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Utilization</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {project.funding?.utilizationPercent ?? 0}%
                </p>
              </div>
              {runwayInfo?.exhaustedDate && (
                <div className="rounded-2xl border border-[hsl(var(--status-danger))]/15 bg-[hsl(var(--status-danger-soft))] p-4 text-[hsl(var(--status-danger))]">
                  <p className="text-xs uppercase tracking-[0.18em]">Estimated depletion</p>
                  <p className="mt-2 text-base font-semibold">{formatDate(runwayInfo.exhaustedDate)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="page-section">
            <h2 className="section-title">Recent updates</h2>
            <div className="mt-5 space-y-4">
              {updates.length > 0 ? (
                updates.slice(0, 4).map((update, index) => (
                  <div key={`${update.title}-${index}`} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-foreground">{update.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(update.createdAt, 'No date')}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {update.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  No formal updates were submitted during this period.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-10 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-medium uppercase tracking-[0.18em] text-foreground">Prepared for review</p>
          <p className="mt-1">Internal delivery workspace summary.</p>
        </div>
        <div className="text-left sm:text-right">
          <p>Infra Not-Red audit stream</p>
          <p className="mt-1">Confidential operational snapshot</p>
        </div>
      </footer>
    </div>
  );
};

export default ProjectAuditReport;
