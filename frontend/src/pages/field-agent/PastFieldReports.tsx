import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MenuItem, Typography } from '@mui/material';
import TextInput from '../../components/TextInput';
import Button from '../../components/Button';
import { ProgressReport, useProgressReport } from '../../hooks/useProgressReport';
import { Project, useProjects } from '../../hooks/useProjects';
import { formatDate } from '../../helpers';

const PastFieldReports: React.FC = () => {
  const { fetchAllProjects, projects } = useProjects();
  const { getReportsByProject, getAllReports, reportsLoading, error } = useProgressReport();

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const hasLoadedInitially = useRef(false);

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p: Project) => map.set(p.id, p.name));
    return map;
  }, [projects]);

  useEffect(() => {
    const init = async () => {
      await fetchAllProjects();
      const all = await getAllReports();
      setReports(all);
      hasLoadedInitially.current = true;
    };
    init();
  }, [fetchAllProjects, getAllReports]);

  useEffect(() => {
    if (!hasLoadedInitially.current) return;
    const load = async () => {
      const data = selectedProjectId ? await getReportsByProject(selectedProjectId) : await getAllReports();
      setReports(data);
    };
    load();
  }, [selectedProjectId, getReportsByProject, getAllReports]);


  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="app-surface p-6 md:p-8">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <Typography variant="h5" className="font-semibold text-slate-900 mb-2">
              Past Field Reports
            </Typography>
            <p className="text-sm muted-text">
              Historical site submissions across projects. Reports are loaded automatically.
            </p>
          </div>
          <Link
            to="/field-agent/report"
            className="rounded-xl border border-[#0f5fa8] px-4 py-2 text-sm font-semibold text-[#0f5fa8] hover:bg-[#eef6ff]"
          >
            Back To Submit Report
          </Link>
        </div>
      </div>

      <div className="app-surface p-6 md:p-8 space-y-5">
        <TextInput
          label="Filter by Project"
          name="selectedProjectId"
          value={selectedProjectId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedProjectId(e.target.value)}
          select
        >
          <MenuItem value="">All Projects</MenuItem>
          {projects.map((project: Project) => (
            <MenuItem key={project.id} value={project.id}>
              {project.name}
            </MenuItem>
          ))}
        </TextInput>

        {error && (
          <Typography color="error" variant="body2" className="rounded-lg border border-red-200 bg-red-50 p-3">
            {error}
          </Typography>
        )}

        {reportsLoading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-sm text-slate-500 text-center">
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-sm text-slate-500 text-center">
            No reports found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reports.map((report) => {
              const projectName = report.projectName || projectNameById.get(report.projectId) || 'Unknown Project';
              return (
                <article key={report._id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  {report.images?.[0] ? (
                    <img src={report.images[0]} alt="Report" className="h-44 w-full object-cover" />
                  ) : (
                    <div className="h-44 w-full bg-slate-100 flex items-center justify-center text-sm text-slate-400">No image</div>
                  )}
                  <div className="p-4 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-[#0f5fa8] font-semibold">{projectName}</p>
                    <p className="text-sm font-semibold text-slate-800">{formatDate(report.timestamp, 'Unknown date')}</p>
                    <p className="text-sm text-slate-700 line-clamp-3">{report.description || 'No remarks provided.'}</p>
                    <p className="text-xs text-slate-500">
                      Lat {Number(report.gpsCoordinates?.latitude ?? 0).toFixed(4)} | Lng {Number(report.gpsCoordinates?.longitude ?? 0).toFixed(4)}
                    </p>
                    <p className="text-xs text-slate-500">{report.images?.length ?? 0} image(s)</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="pt-2">
          <Button type="button" variantType="outlined" onClick={async () => setReports(await getAllReports())} disabled={reportsLoading}>
            Refresh Reports
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PastFieldReports;
