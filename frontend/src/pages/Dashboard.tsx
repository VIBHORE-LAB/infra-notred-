import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronDown,
  FolderKanban,
  MapPinned,
  Plus,
  Search,
  ShieldCheck,
  Tag,
  Wallet,
  X,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import ActivityFeed from '@/components/ActivityFeed';
import AiRiskSummaryWidget from '@/components/AiRiskSummaryWidget';
import GISData from '@/components/GISData';
import instance from '@/api/api';
import { useAuth } from '@/context/AuthContext';
import { useActivity } from '@/hooks/useActivity';
import { Project, useProjects } from '@/hooks/useProjects';
import { fetchAiSummary, PredictionResult } from '@/services/aiService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, riskToneClass, statusToneClass } from '@/lib/presentation';
import { cn } from '@/lib/utils';

const GEOCODE_CACHE_KEY = 'project_location_geocode_cache_v1';
const BULK_STATUSES = ['Planned', 'In Progress', 'On Hold', 'Completed', 'Cancelled', 'Under Review'];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getGeocodeCache = (): Record<string, { lat: number; lon: number }> => {
  try { return JSON.parse(localStorage.getItem(GEOCODE_CACHE_KEY) ?? '{}'); } catch { return {}; }
};
const setGeocodeCache = (cache: Record<string, { lat: number; lon: number }>) => {
  try { localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache)); } catch { /* ignore */ }
};
const geocodeLocation = async (query: string): Promise<{ lat: number; lon: number } | null> => {
  try {
    const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '1' });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const [first] = await res.json();
    if (!first?.lat || !first?.lon) return null;
    return { lat: Number(first.lat), lon: Number(first.lon) };
  } catch { return null; }
};

// ── Inline tag popover for a single project ───────────────────────────────────
interface TagPopoverProps {
  project: Project;
  availableTags: string[];
  onTagAdded: () => Promise<void>;
  canManage: boolean;
}
const TagPopover: React.FC<TagPopoverProps> = ({ project, availableTags, onTagAdded, canManage }) => {
  const [open, setOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const addTag = async (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (!t || project.tags?.includes(t)) return;
    setSaving(true);
    try {
      await instance.post(`/projects/${project.id}/tags`, { payload: { tags: [t] } });
      toast.success(`#${t} added to ${project.name}`);
      await onTagAdded();
    } catch {
      toast.error('Failed to add tag');
    } finally {
      setSaving(false);
      setNewTag('');
    }
  };

  const suggestions = availableTags.filter(
    (t) => !project.tags?.includes(t) && (!newTag || t.includes(newTag.toLowerCase()))
  );

  return (
    <div className="relative" ref={ref}>
      {/* tag chips row */}
      <div className="flex flex-wrap items-center gap-1">
        {(project.tags ?? []).slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary/80"
          >
            #{tag}
          </span>
        ))}
        {(project.tags?.length ?? 0) > 4 && (
          <span className="text-[10px] text-muted-foreground">+{(project.tags?.length ?? 0) - 4}</span>
        )}
        {canManage && (
          <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Manage tags"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* dropdown */}
      {open && (
        <div className="absolute left-0 top-7 z-50 w-56 rounded-xl border border-border bg-popover p-2 shadow-lg">
          <div className="flex gap-1">
            <Input
              autoFocus
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void addTag(newTag); }}
              placeholder="New tag…"
              className="h-7 rounded-lg px-2 text-xs"
              disabled={saving}
            />
            <button
              type="button"
              onClick={() => void addTag(newTag)}
              disabled={saving || !newTag.trim()}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
            >
              <Check className="h-3 w-3" />
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="mt-1.5 max-h-36 overflow-y-auto">
              {suggestions.slice(0, 8).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => void addTag(t)}
                  disabled={saving}
                  className="w-full rounded-lg px-2 py-1 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    fetchAllProjects, fetchAvailableTags, fetchProjectsByTag,
    bulkAddTags, bulkUpdateStatus,
    projects, availableTags, loading: projectsLoading,
  } = useProjects();
  const { seedDemoActivity, fetchCompanyActivity } = useActivity();

  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [tagFilteredProjects, setTagFilteredProjects] = useState<Project[] | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [newBulkTagInput, setNewBulkTagInput] = useState('');
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [allPredictions, setAllPredictions] = useState<Map<string, PredictionResult>>(new Map());
  const [forecastLoading, setForecastLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [projectMarkers, setProjectMarkers] = useState<{
    id: string; name: string; latitude: number; longitude: number;
    description: string; projectName: string; projectDescription: string;
    images: string[]; riskLevel?: 'Low' | 'Medium' | 'High';
    insight?: string; confidenceScore?: number;
  }[]>([]);

  const canManage = ['owner', 'admin'].includes((user?.role ?? '').toLowerCase());

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setForecastLoading(true);
      await fetchAllProjects();
      await fetchAvailableTags();
      
      const summary = await fetchAiSummary();
      if (summary) {
        const preds = new Map<string, PredictionResult>();
        Object.entries(summary.predictions).forEach(([id, p]) => preds.set(id, p));
        setAllPredictions(preds);
      }
      setForecastLoading(false);
    };
    void init();
  }, [fetchAllProjects, fetchAvailableTags]);

  // ── GIS markers ───────────────────────────────────────────────────────────
  useEffect(() => {
    const build = async () => {
      if (projects.length === 0) { setProjectMarkers([]); return; }
      let reports: any[] = [];
      try { reports = (await instance.get('/progress-reports/all')).data?.data?.reports ?? []; } catch { reports = []; }
      const latestByProject = new Map<string, any>();
      for (const r of reports) {
        const pid = r.projectId;
        if (!pid) continue;
        const existing = latestByProject.get(pid);
        if (!existing || new Date(r.createdAt ?? 0) > new Date(existing.createdAt ?? 0)) latestByProject.set(pid, r);
      }
      const cache = getGeocodeCache();
      const markers: typeof projectMarkers = [];
      for (const project of projects) {
        const lr = latestByProject.get(project.id);
        let lat = Number(project.location?.latitude ?? lr?.gpsCoordinates?.latitude);
        let lon = Number(project.location?.longitude ?? lr?.gpsCoordinates?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          const q = [project.location?.city, project.location?.state, project.location?.country].filter(Boolean).join(', ');
          if (q) {
            if (cache[q]) { lat = cache[q].lat; lon = cache[q].lon; }
            else { const geo = await geocodeLocation(q); if (geo) { lat = geo.lat; lon = geo.lon; cache[q] = geo; await sleep(150); } }
          }
        }
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        const loc = [project.location?.city, project.location?.state, project.location?.country].filter(Boolean).join(', ');
        const pred = allPredictions.get(project.id);
        markers.push({ id: project.id, name: project.name, latitude: lat, longitude: lon, description: project.name, projectName: project.name, projectDescription: [project.description, project.status ? `Status: ${project.status}` : '', loc].filter(Boolean).join(' • '), images: lr?.images?.length ? lr.images : [], riskLevel: pred?.riskLevel, insight: pred?.delayReasoning, confidenceScore: pred?.confidenceScore });
      }
      setGeocodeCache(cache);
      setProjectMarkers(markers);
    };
    void build();
  }, [allPredictions, projects]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const sourceProjects = tagFilteredProjects ?? projects;
  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sourceProjects;
    return sourceProjects.filter((p) =>
      [p.name, p.projectType, p.location?.city, p.location?.state].filter(Boolean).some((v) => v!.toLowerCase().includes(q))
    );
  }, [search, sourceProjects]);

  const availableTagOptions = useMemo(() => {
    const tags = new Set<string>(availableTags);
    projects.forEach((p) => (p.tags ?? []).forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [availableTags, projects]);

  const totalBudget = projects.reduce((s, p) => s + (p.funding?.estimatedBudget || 0), 0);
  const avgUtil = projects.length ? Math.round(projects.reduce((s, p) => s + (p.funding?.utilizationPercent || 0), 0) / projects.length) : 0;
  const highRisk = Array.from(allPredictions.values()).filter((p) => p.riskLevel === 'High').length;
  const allVisibleSelected = filteredProjects.length > 0 && filteredProjects.every((p) => selectedProjects.includes(p.id));

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSeedData = async () => {
    setSeeding(true);
    const t = toast.loading('Seeding demo data...');
    try {
      const res = await seedDemoActivity();
      if (res) {
        toast.success(`Seeded ${res.logsCreated} activities!`, { id: t });
        await fetchAllProjects();
        setForecastLoading(true);
        const summary = await fetchAiSummary();
        if (summary) {
          const preds = new Map<string, PredictionResult>();
          Object.entries(summary.predictions).forEach(([id, p]) => preds.set(id, p));
          setAllPredictions(preds);
        }
        setForecastLoading(false);
        await fetchCompanyActivity(1, 20);
      } else {
        toast.error('Failed to seed data', { id: t });
      }
    } catch {
      toast.error('An error occurred during seeding', { id: t });
    } finally {
      setSeeding(false);
    }
  };

  const applyTagFilter = async (tag: string) => {
    if (!tag || tag === 'all') { setActiveTag(''); setTagFilteredProjects(null); return; }
    const result = await fetchProjectsByTag(tag);
    setActiveTag(tag);
    setTagFilteredProjects(result);
    setSelectedProjects([]);
  };

  const clearTagFilter = () => { setActiveTag(''); setTagFilteredProjects(null); setSelectedProjects([]); };

  const toggleSelect = (id: string, checked: boolean) =>
    setSelectedProjects((cur) => checked ? [...new Set([...cur, id])] : cur.filter((x) => x !== id));

  const toggleAll = (checked: boolean) =>
    setSelectedProjects((cur) =>
      checked ? [...new Set([...cur, ...filteredProjects.map((p) => p.id)])] : cur.filter((id) => !filteredProjects.some((p) => p.id === id))
    );

  const handleBulkStatus = async () => {
    if (!bulkStatus || selectedProjects.length === 0) { toast.error('Select projects and a status.'); return; }
    const result = await bulkUpdateStatus(selectedProjects, bulkStatus);
    if (!result) { toast.error('Failed to update.'); return; }
    toast.success(`${result.updatedCount} project${result.updatedCount !== 1 ? 's' : ''} → ${bulkStatus}`);
    setSelectedProjects([]); setBulkStatus('');
    await fetchAllProjects();
    if (activeTag) setTagFilteredProjects(await fetchProjectsByTag(activeTag));
  };

  const handleBulkTag = async (tag: string) => {
    const t = (tag || newBulkTagInput).trim().toLowerCase();
    if (!t || selectedProjects.length === 0) { toast.error('Select projects and enter a tag.'); return; }
    const result = await bulkAddTags(selectedProjects, [t]);
    if (!result) { toast.error('Failed to add tag.'); return; }
    toast.success(`#${t} added to ${result.updatedCount} project${result.updatedCount !== 1 ? 's' : ''}`);
    setBulkTagOpen(false); setNewBulkTagInput('');
    await fetchAvailableTags(); await fetchAllProjects();
    if (activeTag) setTagFilteredProjects(await fetchProjectsByTag(activeTag));
  };

  const refreshProjects = async () => {
    await fetchAllProjects();
    await fetchAvailableTags();
    if (activeTag) setTagFilteredProjects(await fetchProjectsByTag(activeTag));
  };

  // ── Stat tiles ────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Projects', value: projects.length, icon: FolderKanban, color: 'text-blue-500' },
    { label: 'Total budget', value: formatCurrency(totalBudget), icon: Wallet, color: 'text-emerald-500' },
    { label: 'Avg utilization', value: `${avgUtil}%`, icon: ShieldCheck, color: 'text-violet-500' },
    { label: 'High-risk', value: highRisk, icon: MapPinned, color: 'text-rose-500' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Portfolio overview
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Welcome back,{' '}
            <span className="font-medium text-foreground">
              {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.role || 'team member'}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {user?.role === 'owner' && (
            <Button
              variant="secondary"
              size="sm"
              className="rounded-xl border-dashed"
              onClick={handleSeedData}
              disabled={seeding}
            >
              <Sparkles className={cn("mr-1.5 h-3.5 w-3.5", seeding && "animate-spin")} />
              {seeding ? 'Seeding...' : 'Seed sample data'}
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link to="/public">Public portal</Link>
          </Button>
          {user?.role === 'owner' && (
            <Button asChild size="sm" className="rounded-xl">
              <Link to="/projects/create">
                New project <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* ── Stat tiles ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={cn('h-4 w-4', s.color)} />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Left column */}
        <div className="space-y-6">

          {/* Projects table */}
          <div className="rounded-2xl bg-card">
            {/* Table header bar */}
            <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">Project operations</p>
                <p className="text-xs text-muted-foreground">Filter, tag, and manage your portfolio</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects…"
                  className="h-9 rounded-xl pl-9 text-sm"
                />
              </div>
            </div>

            {/* Tag chips — click instantly filters */}
            <div className="flex flex-wrap items-center gap-1.5 px-5 pb-3">
              <button
                type="button"
                onClick={clearTagFilter}
                className={cn(
                  'rounded-full px-3 py-1 text-xs transition-colors',
                  !activeTag
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                All
              </button>
              {availableTagOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => void (activeTag === tag ? clearTagFilter() : applyTagFilter(tag))}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs transition-colors',
                    activeTag === tag
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>

            {/* ── Bulk actions bar — only shown when rows are selected ── */}
            {canManage && selectedProjects.length > 0 && (
              <div className="mx-4 mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-primary/5 px-4 py-2.5">
                <span className="text-xs font-semibold text-primary">
                  {selectedProjects.length} selected
                </span>
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  {/* Status update */}
                  <Select value={bulkStatus} onValueChange={setBulkStatus}>
                    <SelectTrigger className="h-8 min-w-[150px] rounded-xl text-xs">
                      <SelectValue placeholder="Set status…" />
                    </SelectTrigger>
                    <SelectContent>
                      {BULK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-8 rounded-xl text-xs" onClick={() => void handleBulkStatus()} disabled={!bulkStatus}>
                    Apply status
                  </Button>

                  {/* Divider */}
                  <span className="hidden h-4 w-px bg-border sm:block" />

                  {/* Bulk tag — dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setBulkTagOpen((p) => !p)}
                      className="flex h-8 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs text-muted-foreground hover:bg-accent"
                    >
                      <Tag className="h-3 w-3" />
                      Add tag
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {bulkTagOpen && (
                      <div className="absolute left-0 top-10 z-50 w-56 rounded-xl border border-border bg-popover p-2 shadow-lg">
                        <div className="flex gap-1">
                          <Input
                            autoFocus
                            value={newBulkTagInput}
                            onChange={(e) => setNewBulkTagInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') void handleBulkTag(newBulkTagInput); }}
                            placeholder="Custom tag…"
                            className="h-7 rounded-lg text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => void handleBulkTag(newBulkTagInput)}
                            disabled={!newBulkTagInput.trim()}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="mt-1.5 max-h-36 overflow-y-auto">
                          {availableTagOptions.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => void handleBulkTag(t)}
                              className="w-full rounded-lg px-2 py-1 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              #{t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProjects([])}
                  className="ml-auto rounded-lg p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Table */}
            {projectsLoading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 px-5 text-center">
                <p className="text-sm font-medium text-foreground">No projects match</p>
                <p className="text-xs text-muted-foreground">Try another search term or click a different tag above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      {canManage && (
                        <TableHead className="w-10 pl-5">
                          <Checkbox
                            checked={allVisibleSelected}
                            onCheckedChange={(c) => toggleAll(Boolean(c))}
                            aria-label="Select all"
                          />
                        </TableHead>
                      )}
                      <TableHead className={canManage ? '' : 'pl-5'}>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Funding</TableHead>
                      <TableHead>Forecast</TableHead>
                      <TableHead className="pr-5 text-right">Open</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => {
                      const forecast = allPredictions.get(project.id);
                      return (
                        <TableRow key={project.id} className="border-border/40">
                          {canManage && (
                            <TableCell className="pl-5">
                              <Checkbox
                                checked={selectedProjects.includes(project.id)}
                                onCheckedChange={(c) => toggleSelect(project.id, Boolean(c))}
                                aria-label={`Select ${project.name}`}
                              />
                            </TableCell>
                          )}
                          <TableCell className={cn('min-w-[260px]', !canManage && 'pl-5')}>
                            <p className="font-medium text-foreground">{project.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {project.projectType || 'Infrastructure'} · {project.location?.city || 'Unknown'}
                            </p>
                            {/* Inline tag manager */}
                            <div className="mt-1.5">
                              <TagPopover
                                project={project}
                                availableTags={availableTagOptions}
                                onTagAdded={refreshProjects}
                                canManage={canManage}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide', statusToneClass(project.status))}>
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-[160px]">
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{formatCurrency(project.funding?.estimatedBudget)}</span>
                                <span>{project.funding?.utilizationPercent ?? 0}%</span>
                              </div>
                              <Progress value={project.funding?.utilizationPercent ?? 0} className="h-1.5" />
                            </div>
                          </TableCell>
                          <TableCell>
                            {forecast ? (
                              <Badge className={cn('rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide', riskToneClass(forecast.riskLevel))}>
                                {forecast.riskLevel}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="pr-5 text-right">
                            <Button asChild variant="ghost" size="sm" className="h-7 rounded-xl text-xs">
                              <Link to={`/projects/${project.id}`}>Open</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            {/* bottom padding */}
            <div className="h-3" />
          </div>

          {/* Map */}
          <div className="rounded-2xl bg-card">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-semibold text-foreground">Site map</p>
                <p className="text-xs text-muted-foreground">Project coordinates from field evidence</p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground">
                {projectMarkers.length} markers
              </span>
            </div>
            <div className="mx-4 mb-4 h-[380px] overflow-hidden rounded-xl">
              <GISData staticMarkers={projectMarkers} />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <AiRiskSummaryWidget projects={projects} predictions={allPredictions} loading={forecastLoading} />
          <ActivityFeed
            companyWide
            title="Company activity"
            description="Recent actions across your team"
            maxHeightClassName="max-h-[min(60vh,42rem)]"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
