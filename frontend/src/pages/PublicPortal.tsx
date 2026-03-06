import React, { useEffect, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { usePublicPortal } from '../hooks/usePublicPortal';

const STATUS_COLORS: Record<string, string> = {
  Planned: 'bg-blue-50 text-blue-700 border-blue-200',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'On Hold': 'bg-rose-50 text-rose-700 border-rose-200',
};

const PublicPortal: React.FC = () => {
  const { projects, loadingProjects, error, fetchProjects } = usePublicPortal();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.location?.city?.toLowerCase().includes(query) ||
        project.location?.state?.toLowerCase().includes(query),
    );
  }, [projects, search]);

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0f5fa8] text-white grid place-items-center font-semibold">IM</div>
            <div>
              <Typography variant="h6" className="font-semibold text-slate-900">
                r/infrastructure
              </Typography>
              <p className="text-xs text-slate-500">Public project threads. Click a post to open full details and comments.</p>
            </div>
          </div>

          <Link
            to="/login"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#0f5fa8] hover:text-[#0f5fa8]"
          >
            Team Login
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <section className="app-surface p-6 md:p-8 space-y-4">
          <Typography variant="h4" className="font-semibold text-slate-900">
            Project Feed
          </Typography>
          <p className="muted-text text-sm">Each project is a discussion post. Open one to view complete details and participate in its thread.</p>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project name, city, or state"
            className="w-full md:w-[420px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#0f5fa8]"
          />

          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        </section>

        {loadingProjects ? (
          <div className="app-surface p-10 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0f5fa8]"></div>
          </div>
        ) : (
          <section className="space-y-4">
            {filteredProjects.map((project) => {
              const util = project.funding?.utilizationPercent ?? 0;
              const barColor = util > 90 ? 'bg-rose-500' : util > 65 ? 'bg-amber-500' : 'bg-emerald-500';
              const threadComments = project.commentCount ?? 0;
              const voteScore = project.voteScore ?? 0;
              const upActive = project.userVote === 'up';
              const downActive = project.userVote === 'down';

              return (
                <Link
                  key={project.id}
                  to={`/public/projects/${project.id}`}
                  className="block app-surface overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition"
                >
                  <article className="flex">
                    <aside className="w-16 border-r border-slate-200 bg-slate-50 p-3 flex flex-col items-center gap-2">
                      <span className={`text-sm ${upActive ? 'text-orange-700' : 'text-slate-400'}`}>▲</span>
                      <span className="text-xs font-semibold text-slate-700">{voteScore}</span>
                      <span className={`text-sm ${downActive ? 'text-orange-700' : 'text-slate-400'}`}>▼</span>
                      <span className="text-[10px] text-slate-500 mt-1">{threadComments}</span>
                    </aside>

                    <div className="flex-1 p-5 md:p-6 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-500">r/infrastructure • Public Project Thread</p>
                          <h3 className="text-lg font-semibold text-slate-900 mt-1">{project.name}</h3>
                          <p className="text-sm text-slate-600 mt-1">
                            {project.location?.city}, {project.location?.state} • {project.projectType || 'Infrastructure'}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium border whitespace-nowrap ${
                            STATUS_COLORS[project.status] ?? 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>

                      <p className="text-sm text-slate-700 line-clamp-2">{project.description || 'No description available.'}</p>

                      <div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Fund utilization</span>
                          <span>{util}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 mt-1">
                          <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${Math.min(util, 100)}%` }}></div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500">Open thread →</div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
};

export default PublicPortal;
