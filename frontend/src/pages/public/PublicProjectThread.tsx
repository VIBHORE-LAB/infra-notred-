import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowBigUp,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Camera,
  CheckCircle2,
  Megaphone,
  MessageSquare,
  Send,
  Star,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { toast } from 'sonner';
import ProjectRatingDialog from '@/components/public/ProjectRatingDialog';
import ProjectRatingSummary from '@/components/public/ProjectRatingSummary';
import { formatDate } from '@/helpers';
import { usePublicPortal } from '@/hooks/usePublicPortal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, statusToneClass } from '@/lib/presentation';
import { cn } from '@/lib/utils';

const priorityToneClass = (p?: string) => {
  switch ((p ?? '').toLowerCase()) {
    case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/30';
    case 'urgent':   return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    default:         return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
  }
};

const PublicProjectThread: React.FC = () => {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const {
    projectDetails, ratingsByProject, announcementsByProject,
    threadsByProject, watchersByProject, publicSignoffsByProject,
    loadingProjectDetail, loadingRatings, submitting, error,
    fetchProjectDetail, addProjectComment, voteProjectThread,
    fetchProjectRatings, rateProject, fetchAnnouncements, fetchThreads,
    createThread, replyToThread, upvoteDiscussionThread, upvoteDiscussionReply,
    fetchWatchers, toggleWatchlist, fetchPublicSignoffs,
  } = usePublicPortal();

  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [authorName, setAuthorName]       = useState('');
  const [comment, setComment]             = useState('');
  const [threadAuthor, setThreadAuthor]   = useState('');
  const [threadTitle, setThreadTitle]     = useState('');
  const [threadBody, setThreadBody]       = useState('');
  const [replyAuthors, setReplyAuthors]   = useState<Record<string, string>>({});
  const [replyDrafts, setReplyDrafts]     = useState<Record<string, string>>({});
  const [expandedThread, setExpandedThread] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    void fetchProjectDetail(projectId);
    void fetchProjectRatings(projectId);
    void fetchAnnouncements(projectId);
    void fetchThreads(projectId);
    void fetchWatchers(projectId);
    void fetchPublicSignoffs(projectId);
  }, [fetchAnnouncements, fetchProjectDetail, fetchProjectRatings, fetchPublicSignoffs, fetchThreads, fetchWatchers, projectId]);

  const detail      = useMemo(() => projectDetails[projectId], [projectDetails, projectId]);
  const ratings     = ratingsByProject[projectId];
  const announcements = announcementsByProject[projectId] ?? [];
  const threads     = threadsByProject[projectId] ?? [];
  const watcherState  = watchersByProject[projectId];
  const publicSignoffs = publicSignoffsByProject[projectId] ?? [];

  const distribution = useMemo(() =>
    [5, 4, 3, 2, 1].map((v) => ({
      label: `${v} star`,
      count: Number(ratings?.distribution?.[String(v)] ?? 0),
      percent: Number(ratings?.totalRatings ?? 0) > 0
        ? (Number(ratings?.distribution?.[String(v)] ?? 0) / Number(ratings?.totalRatings ?? 1)) * 100
        : 0,
    })),
    [ratings?.distribution, ratings?.totalRatings]
  );

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) { toast.error('Write something before posting.'); return; }
    const ok = await addProjectComment(projectId, { content: comment, authorName: authorName || 'Anonymous citizen' });
    if (!ok) { toast.error('Failed to post comment.'); return; }
    setComment(''); toast.success('Comment posted!');
  };

  const handleVote = async (dir: 'up' | 'down') => {
    const ok = await voteProjectThread(projectId, dir);
    if (!ok) { toast.error('Failed to update vote.'); return; }
    toast.success(dir === 'up' ? 'Upvoted!' : 'Downvoted.');
  };

  const handleRate = async (payload: { stars: number; sentimentTag?: string }) => {
    const ok = await rateProject(projectId, payload);
    if (!ok) { toast.error('Failed to submit rating.'); return false; }
    toast.success('Rating submitted!'); return true;
  };

  const handleWatch = async () => {
    const ok = await toggleWatchlist(projectId);
    if (!ok) { toast.error('Failed to update watchlist.'); return; }
    toast.success(ok.isWatching ? 'Project saved.' : 'Removed from saved.');
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadTitle.trim() || !threadBody.trim()) { toast.error('Fill in title and message.'); return; }
    const ok = await createThread(projectId, { title: threadTitle.trim(), body: threadBody.trim(), authorName: threadAuthor || 'Anonymous citizen' });
    if (!ok) { toast.error('Failed to post thread.'); return; }
    setThreadTitle(''); setThreadBody(''); toast.success('Thread posted.');
  };

  const handleReply = async (threadId: string) => {
    const body = replyDrafts[threadId]?.trim();
    if (!body) { toast.error('Write a reply first.'); return; }
    const ok = await replyToThread(projectId, threadId, { body, authorName: replyAuthors[threadId] || 'Anonymous citizen' });
    if (!ok) { toast.error('Failed to post reply.'); return; }
    setReplyDrafts((c) => ({ ...c, [threadId]: '' }));
    toast.success('Reply posted.');
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loadingProjectDetail && !detail) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">Project not found.</p>
        <Button asChild variant="outline" className="rounded-xl"><Link to="/public">Back to feed</Link></Button>
      </div>
    );
  }

  const { project, forum } = detail;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-4 sm:px-6">
      {/* ── Top nav bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-xl">
          <Link to="/public"><ArrowLeft className="mr-1.5 h-4 w-4" />Back to feed</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn('rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest', statusToneClass(project.status))}>
            {project.status}
          </Badge>
          {project.projectType && (
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-widest">
              {project.projectType}
            </Badge>
          )}
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px] xl:items-start">

        {/* ══ LEFT COLUMN ════════════════════════════════════════════════════ */}
        <div className="space-y-5">

          {/* Project hero card */}
          <div className="rounded-2xl bg-card p-5 sm:p-6">
            {/* Location breadcrumb */}
            <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
              {[project.location?.city, project.location?.state, project.location?.country].filter(Boolean).join(' · ')}
            </p>

            {/* Title & actions row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{project.name}</h1>
                {project.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{project.description}</p>
                )}
                <div className="mt-3">
                  <ProjectRatingSummary
                    averageRating={project.averageRating ?? ratings?.averageRating}
                    totalRatings={project.totalRatings ?? ratings?.totalRatings}
                  />
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => void handleWatch()}>
                  {watcherState?.isWatching ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  {watcherState?.totalWatchers ?? 0}
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setRatingDialogOpen(true)}>
                  <Star className="h-4 w-4" />
                  Rate
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <Link to={`/projects/${projectId}/gallery`}>
                    <Camera className="h-4 w-4" />Photos
                  </Link>
                </Button>
              </div>
            </div>

            {/* Funding tiles */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Budget',    value: formatCurrency(project.funding?.estimatedBudget) },
                { label: 'Allocated', value: formatCurrency(project.funding?.totalAllocated) },
                { label: 'Spent',     value: formatCurrency(project.funding?.totalSpent) },
                { label: 'Team size', value: project.teamsize ?? 0 },
              ].map((tile) => (
                <div key={tile.label} className="rounded-xl bg-muted/40 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{tile.label}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{tile.value}</p>
                </div>
              ))}
            </div>

            {/* Utilization bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Fund utilization</span>
                <span>{project.funding?.utilizationPercent ?? 0}%</span>
              </div>
              <Progress value={project.funding?.utilizationPercent ?? 0} className="h-1.5" />
            </div>
          </div>

          {/* ── Always-visible: Leave a comment ──────────────────────────── */}
          <div className="rounded-2xl bg-card p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Leave a comment</h2>
            </div>
            <form onSubmit={submitComment} className="space-y-3">
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your name (optional – defaults to Anonymous)"
                className="h-10 rounded-xl"
              />
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts, concerns, or questions about this project…"
                className="min-h-[100px] resize-none rounded-xl"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  <Button
                    type="button" variant="outline" size="sm" className="rounded-xl"
                    disabled={submitting || forum.userVote === 'up'}
                    onClick={() => void handleVote('up')}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" /> Upvote
                  </Button>
                  <Button
                    type="button" variant="outline" size="sm" className="rounded-xl"
                    disabled={submitting || forum.userVote === 'down'}
                    onClick={() => void handleVote('down')}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" /> Downvote
                  </Button>
                </div>
                <Button type="submit" size="sm" className="rounded-xl" disabled={submitting || !comment.trim()}>
                  <Send className="h-3.5 w-3.5" /> Post comment
                </Button>
              </div>
            </form>

            {/* Existing comments */}
            {forum.comments.length > 0 && (
              <div className="mt-5 space-y-3">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {forum.commentCount} comment{forum.commentCount !== 1 ? 's' : ''}
                </p>
                {forum.comments.map((item) => (
                  <div key={item.id} className="rounded-xl bg-muted/30 p-3.5">
                    <p className="text-sm leading-relaxed text-foreground">{item.content}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {item.authorName || 'Anonymous'} · {formatDate(item.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Tabs: Announcements / Q&A / Sign-offs / Details ─────────── */}
          <div className="rounded-2xl bg-card">
            <Tabs defaultValue="announcements" className="flex flex-col gap-0">
              <div className="border-b border-border/50 px-5">
                <TabsList variant="line" className="h-auto w-full justify-start rounded-none bg-transparent p-0">
                  <TabsTrigger value="announcements" className="rounded-none px-4 py-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary">
                    Announcements
                    {announcements.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {announcements.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="qa" className="rounded-none px-4 py-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary">
                    Community Q&amp;A
                    {threads.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {threads.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="signoffs" className="rounded-none px-4 py-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary">
                    Sign-offs
                  </TabsTrigger>
                  <TabsTrigger value="details" className="rounded-none px-4 py-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary">
                    Details
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Announcements tab */}
              <TabsContent value="announcements" className="min-h-[320px] space-y-3 p-5">
                {announcements.length === 0 ? (
                  <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                    No announcements yet
                  </div>
                ) : (
                  announcements.map((ann) => (
                    <div key={ann.id} className="rounded-xl bg-muted/30 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground">{ann.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(ann.createdAt, 'No date')}</p>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ann.body}</p>
                        </div>
                        <span className={cn('shrink-0 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-widest', priorityToneClass(ann.priority))}>
                          {ann.priority ?? 'normal'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Q&A tab */}
              <TabsContent value="qa" className="min-h-[320px] space-y-4 p-5">
                {/* New thread form */}
                <div className="rounded-xl bg-muted/20 p-4">
                  <p className="mb-3 text-sm font-semibold text-foreground">Start a discussion</p>
                  <form onSubmit={handleCreateThread} className="space-y-2.5">
                    <Input
                      value={threadAuthor}
                      onChange={(e) => setThreadAuthor(e.target.value)}
                      placeholder="Your name (optional)"
                      className="h-9 rounded-xl text-sm"
                    />
                    <Input
                      value={threadTitle}
                      onChange={(e) => setThreadTitle(e.target.value)}
                      placeholder="Thread title *"
                      className="h-9 rounded-xl text-sm"
                    />
                    <Textarea
                      value={threadBody}
                      onChange={(e) => setThreadBody(e.target.value)}
                      placeholder="What would you like to ask or discuss? *"
                      className="min-h-[80px] resize-none rounded-xl text-sm"
                    />
                    <Button type="submit" size="sm" className="rounded-xl" disabled={submitting}>
                      <Send className="h-3.5 w-3.5" /> Post thread
                    </Button>
                  </form>
                </div>

                {threads.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                    No discussions yet — start the first one!
                  </div>
                ) : (
                  threads.map((thread) => (
                    <div key={thread.id} className="rounded-xl bg-muted/30">
                      {/* Thread header */}
                      <div className="flex items-start justify-between gap-3 p-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground">{thread.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {thread.authorName || 'Anonymous'} · {formatDate(thread.createdAt, '')}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{thread.body}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs"
                            onClick={() => void upvoteDiscussionThread(projectId, thread.id).then((ok) => ok && toast.success('Voted!'))}>
                            <ArrowBigUp className="h-3.5 w-3.5" />{thread.upvoteCount}
                          </Button>
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
                          >
                            {expandedThread === thread.id ? 'Collapse' : `Replies (${thread.replyCount})`}
                          </button>
                        </div>
                      </div>

                      {/* Replies — shown when expanded */}
                      {expandedThread === thread.id && (
                        <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-3">
                          {thread.replies.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No replies yet.</p>
                          ) : (
                            thread.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start justify-between gap-3 rounded-lg bg-background/60 p-3">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm text-foreground">{reply.body}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {reply.authorName || 'Anonymous'} · {formatDate(reply.createdAt, '')}
                                  </p>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 shrink-0 rounded-lg text-xs"
                                  onClick={() => void upvoteDiscussionReply(projectId, thread.id, reply.id).then((ok) => ok && toast.success('Voted!'))}>
                                  <ArrowBigUp className="h-3.5 w-3.5" />{reply.upvoteCount}
                                </Button>
                              </div>
                            ))
                          )}
                          {/* Reply box */}
                          <div className="space-y-2 pt-1">
                            <Input
                              value={replyAuthors[thread.id] ?? ''}
                              onChange={(e) => setReplyAuthors((c) => ({ ...c, [thread.id]: e.target.value }))}
                              placeholder="Your name (optional)"
                              className="h-8 rounded-xl text-xs"
                            />
                            <Textarea
                              value={replyDrafts[thread.id] ?? ''}
                              onChange={(e) => setReplyDrafts((c) => ({ ...c, [thread.id]: e.target.value }))}
                              placeholder="Write a reply…"
                              className="min-h-[64px] resize-none rounded-xl text-sm"
                            />
                            <Button size="sm" className="h-8 rounded-xl text-xs" disabled={submitting}
                              onClick={() => void handleReply(thread.id)}>
                              Reply
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Sign-offs tab */}
              <TabsContent value="signoffs" className="min-h-[320px] space-y-3 p-5">
                {publicSignoffs.length === 0 ? (
                  <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                    No public sign-offs yet
                  </div>
                ) : (
                  publicSignoffs.map((s) => (
                    <div key={s.id} className="flex items-start gap-3 rounded-xl bg-muted/30 p-4">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{s.title}</p>
                        <p className="mt-0.5 text-xs uppercase tracking-widest text-muted-foreground">{s.signoffType}</p>
                        {s.remarks && <p className="mt-1.5 text-sm text-muted-foreground">{s.remarks}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(s.signedAt, '')}</p>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Details tab */}
              <TabsContent value="details" className="min-h-[320px] p-5">
                <div className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                  {[
                    ['Type',     project.projectType || 'Infrastructure'],
                    ['Country',  project.location?.country || '—'],
                    ['State',    project.location?.state || '—'],
                    ['City',     project.location?.city || '—'],
                    ['Zip',      project.location?.zipCode || '—'],
                    ['Area',     project.location?.areaInSqFt ? `${project.location.areaInSqFt} sq ft` : '—'],
                    ['Start',    formatDate(project.timeline?.startDate)],
                    ['End',      formatDate(project.timeline?.endDate)],
                    ['Deadline', formatDate(project.timeline?.deadline)],
                    ['Team',     `${project.teamsize ?? 0} members`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-baseline gap-2 border-b border-border/30 pb-2">
                      <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
                      <span className="text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* ══ RIGHT COLUMN ═══════════════════════════════════════════════════ */}
        <div className="space-y-5 xl:sticky xl:top-20">

          {/* Community response */}
          <div className="rounded-2xl bg-card p-5">
            <h3 className="mb-4 font-semibold text-foreground">Community response</h3>

            <ProjectRatingSummary
              averageRating={project.averageRating ?? ratings?.averageRating}
              totalRatings={project.totalRatings ?? ratings?.totalRatings}
            />

            {/* Star distribution */}
            <div className="mt-4 space-y-2">
              {loadingRatings ? (
                <div className="flex h-24 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                </div>
              ) : (
                distribution.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="w-12 shrink-0 text-xs text-muted-foreground">{item.label}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-muted h-1.5">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${item.percent}%` }} />
                    </div>
                    <span className="w-4 shrink-0 text-right text-xs text-muted-foreground">{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="rounded-2xl bg-card p-5">
            <h3 className="mb-3 font-semibold text-foreground">Activity</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Comments',  value: forum.commentCount },
                { label: 'Threads',   value: threads.length },
                { label: 'Watching',  value: watcherState?.totalWatchers ?? 0 },
                { label: 'Notices',   value: announcements.length },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-muted/40 p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Latest announcement callout */}
          {announcements.filter((a) => ['critical','urgent'].includes((a.priority ?? '').toLowerCase())).slice(0,3).length > 0 && (
            <div className="rounded-2xl bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-foreground">Priority notices</h3>
              </div>
              <div className="space-y-2">
                {announcements
                  .filter((a) => ['critical','urgent'].includes((a.priority ?? '').toLowerCase()))
                  .slice(0, 3)
                  .map((ann) => (
                    <div key={ann.id} className="rounded-xl bg-muted/30 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{ann.title}</p>
                        <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest', priorityToneClass(ann.priority))}>
                          {ann.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(ann.createdAt, '')}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <ProjectRatingDialog
        open={ratingDialogOpen}
        onOpenChange={setRatingDialogOpen}
        projectName={project.name}
        ratings={ratings}
        submitting={submitting}
        onSubmit={handleRate}
      />
    </div>
  );
};

export default PublicProjectThread;
