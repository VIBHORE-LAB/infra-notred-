import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Filter, Globe2, MapPinned, MessagesSquare, Search, Star } from 'lucide-react';
import { toast } from 'sonner';
import ProjectRatingDialog from '@/components/public/ProjectRatingDialog';
import ProjectRatingSummary from '@/components/public/ProjectRatingSummary';
import { PublicProject, usePublicPortal } from '@/hooks/usePublicPortal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { statusToneClass } from '@/lib/presentation';

const STATUS_OPTIONS = ['Planned', 'In Progress', 'On Hold', 'Completed', 'Cancelled', 'Under Review'];
const SORT_OPTIONS = [
  { label: 'Latest', value: 'date' as const },
  { label: 'Budget', value: 'budget' as const },
  { label: 'Most Voted', value: 'votes' as const },
];

const PublicPortal: React.FC = () => {
  const {
    projects,
    ratingsByProject,
    watchersByProject,
    searchMeta,
    loadingProjects,
    loadingRatings,
    submitting,
    error,
    searchProjects,
    fetchProjectRatings,
    rateProject,
    fetchWatchers,
    toggleWatchlist,
  } = usePublicPortal();

  const [filters, setFilters] = useState({
    q: '',
    city: '',
    status: 'all',
    projectType: 'all',
    sortBy: 'date' as 'date' | 'budget' | 'votes',
    budgetRange: [0, 1000000000] as [number, number],
    page: 1,
  });
  const [activeProject, setActiveProject] = useState<PublicProject | null>(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);

  useEffect(() => {
    void searchProjects({
      q: '',
      city: '',
      sortBy: 'date',
      page: 1,
      limit: 12,
    });
  }, [searchProjects]);

  useEffect(() => {
    projects.forEach((project) => {
      if (!watchersByProject[project.id]) {
        void fetchWatchers(project.id);
      }
    });
  }, [fetchWatchers, projects, watchersByProject]);

  const projectTypes = useMemo(() => {
    const types = new Set<string>();
    projects.forEach((project) => {
      if (project.projectType) types.add(project.projectType);
    });
    return Array.from(types).sort();
  }, [projects]);

  const applyFilters = async (page = filters.page) => {
    await searchProjects({
      q: filters.q,
      city: filters.city,
      status: filters.status === 'all' ? '' : filters.status,
      projectType: filters.projectType === 'all' ? '' : filters.projectType,
      minBudget: filters.budgetRange[0],
      maxBudget: filters.budgetRange[1],
      sortBy: filters.sortBy,
      page,
      limit: 12,
    });
    setFilters((current) => ({ ...current, page }));
  };

  const resetFilters = async () => {
    const nextFilters = {
      q: '',
      city: '',
      status: 'all',
      projectType: 'all',
      sortBy: 'date' as const,
      budgetRange: [0, 1000000000] as [number, number],
      page: 1,
    };
    setFilters(nextFilters);
    await searchProjects({
      q: '',
      city: '',
      sortBy: 'date',
      page: 1,
      limit: 12,
    });
  };

  const openRatingDialog = async (project: PublicProject) => {
    setActiveProject(project);
    setRatingDialogOpen(true);
    await fetchProjectRatings(project.id);
  };

  const handleSubmitRating = async (payload: { stars: number; sentimentTag?: string }) => {
    if (!activeProject) return;
    const result = await rateProject(activeProject.id, payload);
    if (!result) {
      toast.error('Unable to submit the rating.');
      return false;
    }
    toast.success('Thanks for sharing your rating.');
    return true;
  };

  const handleToggleWatch = async (projectId: string) => {
    const result = await toggleWatchlist(projectId);
    if (!result) {
      toast.error('Unable to update saved projects.');
      return;
    }
    toast.success(result.isWatching ? 'Project saved.' : 'Project removed from saved projects.');
  };

  return (
    <div className="min-h-screen bg-background px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="border-border/80">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <Globe2 className="h-5 w-5" />
                </div>
                <CardTitle>Infra Not-Red Public Portal</CardTitle>
                <CardDescription className="max-w-3xl text-sm leading-6">
                  Explore Infra Not-Red projects, inspect spending pressure, read announcements, and leave ratings or questions tied to each project.
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" className="rounded-2xl">
                  <Link to="/map">
                    <MapPinned className="h-4 w-4" />
                    Budget map
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl">
                  <Link to="/saved-projects">
                    <BookmarkCheck className="h-4 w-4" />
                    My saved projects
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl">
                  <Link to="/gallery/company">
                    Company gallery
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl">
                  <Link to="/login">Infra Not-Red login</Link>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="metric-card">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Visible projects</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{projects.length}</p>
              </div>
              <div className="metric-card">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Search results</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{searchMeta.total}</p>
              </div>
              <div className="metric-card">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current page</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {searchMeta.page} / {Math.max(searchMeta.totalPages, 1)}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Filter className="h-4 w-4 text-primary" />
                Search controls
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Filter by location, status, type, budget, and public vote momentum.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2 xl:col-span-2">
                <Label htmlFor="public-search">Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="public-search"
                    value={filters.q}
                    onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
                    placeholder="Project name or description"
                    className="h-11 rounded-2xl pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city-filter">City</Label>
                <Input
                  id="city-filter"
                  value={filters.city}
                  onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}
                  placeholder="Delhi"
                  className="h-11 rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters((current) => ({ ...current, status: value }))}
                >
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any status</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Project type</Label>
                <Select
                  value={filters.projectType}
                  onValueChange={(value) => setFilters((current) => ({ ...current, projectType: value }))}
                >
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any type</SelectItem>
                    {projectTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort by</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value: 'date' | 'budget' | 'votes') =>
                    setFilters((current) => ({ ...current, sortBy: value }))
                  }
                >
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 xl:col-span-3">
                <div className="flex items-center justify-between gap-3">
                  <Label>Budget range</Label>
                  <span className="text-xs text-muted-foreground">
                    ₹{filters.budgetRange[0].toLocaleString('en-IN')} to ₹{filters.budgetRange[1].toLocaleString('en-IN')}
                  </span>
                </div>
                <Slider
                  value={filters.budgetRange}
                  min={0}
                  max={1000000000}
                  step={5000000}
                  onValueChange={(value) =>
                    setFilters((current) => ({
                      ...current,
                      budgetRange: [value[0] ?? 0, value[1] ?? 1000000000] as [number, number],
                    }))
                  }
                />
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">Apply filters</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Use the search controls to narrow the list, then rate or open any project to read deeper community context.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Button className="rounded-2xl" onClick={() => void applyFilters(1)}>
                  Search projects
                </Button>
                <Button variant="outline" className="rounded-2xl" onClick={() => void resetFilters()}>
                  Reset filters
                </Button>
              </div>
            </div>

            {error ? (
              <div className="xl:col-span-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {loadingProjects ? (
          <Card className="border-border/80">
            <CardContent className="flex h-56 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </CardContent>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="border-border/80">
            <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
              <p className="text-lg font-semibold text-foreground">No public projects match these filters.</p>
              <p className="max-w-lg text-sm leading-6 text-muted-foreground">
                Try widening the city or budget range, or reset the filters to return to the full public feed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="border-border/80 transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/30">
                <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${statusToneClass(project.status)}`}>
                          {project.status}
                        </Badge>
                        {project.projectType ? (
                          <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
                            {project.projectType}
                          </Badge>
                        ) : null}
                        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {project.location?.city}, {project.location?.state}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold tracking-tight text-foreground">{project.name}</h3>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                          {project.description || 'No description available.'}
                        </p>
                      </div>

                      <ProjectRatingSummary
                        averageRating={project.averageRating}
                        totalRatings={project.totalRatings}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => void handleToggleWatch(project.id)}
                      >
                        {(watchersByProject[project.id]?.isWatching ?? false) ? (
                          <BookmarkCheck className="h-4 w-4" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                        {watchersByProject[project.id]?.totalWatchers ?? 0}
                      </Button>
                      <Button variant="outline" className="rounded-2xl" onClick={() => void openRatingDialog(project)}>
                        <Star className="h-4 w-4" />
                        Rate project
                      </Button>
                      <Button asChild className="rounded-2xl">
                        <Link to={`/public/projects/${project.id}`}>Open details</Link>
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Budget</p>
                      <p className="mt-2 text-base font-semibold text-foreground">
                        ₹{Number(project.funding?.estimatedBudget || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Team size</p>
                      <p className="mt-2 text-base font-semibold text-foreground">{project.teamsize ?? 0}</p>
                    </div>
                    <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Watchers</p>
                      <div className="mt-2 flex items-center gap-2 text-base font-semibold text-foreground">
                        <BookmarkCheck className="h-4 w-4 text-muted-foreground" />
                        {watchersByProject[project.id]?.totalWatchers ?? 0} saved
                      </div>
                    </div>
                    <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Discussion</p>
                      <div className="mt-2 flex items-center gap-2 text-base font-semibold text-foreground">
                        <MessagesSquare className="h-4 w-4 text-muted-foreground" />
                        {project.commentCount ?? 0} comments
                      </div>
                    </div>
                    <div className="rounded-3xl border border-border/70 bg-muted/30 p-4 md:col-span-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Public vote score</p>
                      <p className="mt-2 text-base font-semibold text-foreground">{project.voteScore ?? 0}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Fund utilization</span>
                      <span>{project.funding?.utilizationPercent ?? 0}%</span>
                    </div>
                    <Progress value={project.funding?.utilizationPercent ?? 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="border-border/80">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-sm font-semibold text-foreground">Page navigation</p>
              <p className="text-sm text-muted-foreground">
                Showing page {searchMeta.page} of {Math.max(searchMeta.totalPages, 1)}.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-2xl"
                disabled={searchMeta.page <= 1 || loadingProjects}
                onClick={() => void applyFilters(searchMeta.page - 1)}
              >
                Previous
              </Button>
              <Button
                className="rounded-2xl"
                disabled={searchMeta.page >= searchMeta.totalPages || loadingProjects}
                onClick={() => void applyFilters(searchMeta.page + 1)}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ProjectRatingDialog
        open={ratingDialogOpen}
        onOpenChange={setRatingDialogOpen}
        projectName={activeProject?.name ?? 'this project'}
        ratings={activeProject ? ratingsByProject[activeProject.id] : null}
        loading={loadingRatings}
        submitting={submitting}
        onSubmit={handleSubmitRating}
      />
    </div>
  );
};

export default PublicPortal;
