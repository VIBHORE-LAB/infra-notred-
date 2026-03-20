import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useProgressReport } from '../../hooks/useProgressReport';
import { Project, useProjects } from '../../hooks/useProjects';
import { formatDate } from '../../helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PastFieldReports: React.FC = () => {
  const { fetchAllProjects, projects } = useProjects();
  const { getReportsByProject, getAllReports, reportsLoading, error } = useProgressReport();
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [reports, setReports] = useState<Awaited<ReturnType<typeof getAllReports>>>([]);
  const hasLoadedInitially = useRef(false);

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((project: Project) => map.set(project.id, project.name));
    return map;
  }, [projects]);

  useEffect(() => {
    const init = async () => {
      await fetchAllProjects();
      const all = await getAllReports();
      setReports(all);
      hasLoadedInitially.current = true;
    };
    void init();
  }, [fetchAllProjects, getAllReports]);

  useEffect(() => {
    if (!hasLoadedInitially.current) return;
    const load = async () => {
      const data = selectedProjectId !== 'all' ? await getReportsByProject(selectedProjectId) : await getAllReports();
      setReports(data);
    };
    void load();
  }, [selectedProjectId, getReportsByProject, getAllReports]);

  return (
    <div className="page-grid mx-auto max-w-6xl">
      <Card className="border-border/80">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Past field reports</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Review submitted updates and site evidence across projects.</p>
            </div>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/field-agent/report">Submit a new report</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border/80">
        <CardContent className="space-y-6 p-6">
          <div className="max-w-md space-y-2">
            <Label>Filter by project</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((project: Project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {reportsLoading ? (
            <div className="flex h-56 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
              No field reports found for this selection.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {reports.map((report) => {
                const projectName = report.projectName || projectNameById.get(report.projectId) || 'Unknown project';
                return (
                  <div key={report._id} className="overflow-hidden rounded-2xl border border-border/80 bg-card">
                    {report.images?.[0] ? (
                      <img src={report.images[0]} alt="Report" className="h-48 w-full object-cover" />
                    ) : (
                      <div className="flex h-48 items-center justify-center bg-muted/30 text-sm text-muted-foreground">No image evidence</div>
                    )}
                    <div className="space-y-3 p-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{projectName}</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{formatDate(report.timestamp, 'Unknown date')}</p>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">{report.description || 'No remarks provided.'}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Lat {Number(report.gpsCoordinates?.latitude ?? 0).toFixed(4)}</span>
                        <span>Lng {Number(report.gpsCoordinates?.longitude ?? 0).toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Button
            variant="outline"
            className="rounded-xl"
            onClick={async () => {
              setReports(await getAllReports());
              toast.success('Reports refreshed.');
            }}
            disabled={reportsLoading}
          >
            Refresh
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PastFieldReports;
