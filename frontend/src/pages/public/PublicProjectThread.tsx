import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Typography } from '@mui/material';
import { usePublicPortal } from '../../hooks/usePublicPortal';
import { formatDate } from '../../helpers';

const STATUS_COLORS: Record<string, string> = {
  Planned: 'bg-blue-50 text-blue-700 border-blue-200',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'On Hold': 'bg-rose-50 text-rose-700 border-rose-200',
};

const PublicProjectThread: React.FC = () => {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const { projectDetails, loadingProjectDetail, submitting, error, fetchProjectDetail, addProjectComment, voteProjectThread } = usePublicPortal();
  const [authorName, setAuthorName] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchProjectDetail(projectId);
    }
  }, [projectId, fetchProjectDetail]);

  const detail = useMemo(() => projectDetails[projectId], [projectDetails, projectId]);

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) return;

    const result = await addProjectComment(projectId, {
      content: comment,
      authorName: authorName || 'Anonymous Citizen',
    });

    if (result) {
      setComment('');
    }
  };

  if (loadingProjectDetail && !detail) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f5fa8]" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen p-6 md:p-10">
        <div className="app-surface p-6 text-center">
          <p className="text-slate-600">Project thread not found.</p>
          <Link to="/public" className="inline-block mt-4 text-sm font-semibold text-[#0f5fa8] hover:underline">
            Back to project feed
          </Link>
        </div>
      </div>
    );
  }

  const { project, forum } = detail;
  const upActive = forum.userVote === 'up';
  const downActive = forum.userVote === 'down';

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-[#0f5fa8] text-white grid place-items-center font-semibold shrink-0">IM</div>
            <div className="min-w-0">
              <Typography variant="h6" className="font-semibold text-slate-900 truncate">
                Project Thread
              </Typography>
              <p className="text-xs text-slate-500 truncate">{project.name}</p>
            </div>
          </div>

          <Link to="/public" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#0f5fa8] hover:text-[#0f5fa8]">
            Back to Feed
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <section className="space-y-5">
          <article className="app-surface overflow-hidden">
            <div className="flex">
              <aside className="w-16 border-r border-slate-200 bg-slate-50 p-3 flex flex-col items-center gap-2">
                <button
                  className={`text-lg ${upActive ? 'text-orange-700' : 'text-slate-400 hover:text-orange-700'}`}
                  onClick={() => voteProjectThread(projectId, 'up')}
                  disabled={submitting || upActive}
                  aria-label="upvote"
                >
                  ▲
                </button>
                <span className="text-xs font-semibold text-slate-700">{forum.voteScore}</span>
                <button
                  className={`text-lg ${downActive ? 'text-orange-700' : 'text-slate-400 hover:text-orange-700'}`}
                  onClick={() => voteProjectThread(projectId, 'down')}
                  disabled={submitting || downActive}
                  aria-label="downvote"
                >
                  ▼
                </button>
                <span className="text-[10px] text-slate-500 mt-1">{forum.commentCount}</span>
              </aside>

              <div className="flex-1 p-5 md:p-6">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs text-slate-500">posted in r/infrastructure</p>
                    <h1 className="text-2xl font-semibold text-slate-900 mt-1">{project.name}</h1>
                    <p className="text-sm text-slate-600 mt-2">{project.location?.city}, {project.location?.state} • {project.projectType || 'Infrastructure'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium border ${STATUS_COLORS[project.status] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {project.status}
                  </span>
                </div>

                <p className="text-sm text-slate-800 mt-4 whitespace-pre-wrap">{project.description || 'No description provided.'}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Budget</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">₹{Number(project.funding?.estimatedBudget || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Allocated</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">₹{Number(project.funding?.totalAllocated || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Spent</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">₹{Number(project.funding?.totalSpent || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Team size</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{project.teamsize ?? 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">Start: {formatDate(project.timeline?.startDate)}</div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">End: {formatDate(project.timeline?.endDate)}</div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">Deadline: {formatDate(project.timeline?.deadline)}</div>
                </div>
              </div>
            </div>
          </article>

          <section className="app-surface p-5 md:p-6">
            <h2 className="text-lg font-semibold text-slate-900">Comments ({forum.commentCount})</h2>

            <form onSubmit={submitComment} className="mt-4 space-y-3">
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Display name (optional)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add to the discussion"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-28"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-[#0f5fa8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c4f8c] disabled:opacity-70"
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mt-4">{error}</div>}

            <div className="mt-5 space-y-3">
              {forum.comments.length === 0 ? (
                <p className="text-sm text-slate-500">No comments yet. Be the first one.</p>
              ) : (
                forum.comments.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{item.content}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {item.authorName || 'Anonymous'} • {formatDate(item.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          <section className="app-surface p-4">
            <h3 className="text-sm font-semibold text-slate-900">Thread Metadata</h3>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li>Status: {project.status}</li>
              <li>Type: {project.projectType || 'Infrastructure'}</li>
              <li>Location: {project.location?.city}, {project.location?.state}, {project.location?.country || '-'}</li>
              <li>Zip: {project.location?.zipCode || '-'}</li>
              <li>Area: {project.location?.areaInSqFt || '-'} sq ft</li>
            </ul>
          </section>
        </aside>
      </main>
    </div>
  );
};

export default PublicProjectThread;
