import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Project, useProjects } from '@/hooks/useProjects';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, statusToneClass } from '@/lib/presentation';
import { cn } from '@/lib/utils';

const Projects: React.FC = () => {
  const { user } = useAuth();
  const { fetchAllProjects, projects, loading } = useProjects();
  const [search, setSearch] = useState('');

  useEffect(() => {
    void fetchAllProjects();
  }, [fetchAllProjects]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;

    return projects.filter((project: Project) =>
      [project.name, project.projectType, project.location?.city, project.location?.state]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    );
  }, [projects, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Projects list</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? 's' : ''} visible for{' '}
            <span className="font-medium text-foreground">
              {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.role || 'this user'}
            </span>
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects…"
            className="h-10 rounded-xl pl-9 text-sm"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card">
        {loading ? (
          <div className="flex min-h-[18rem] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex min-h-[18rem] flex-col items-center justify-center gap-2 px-5 text-center">
            <p className="text-sm font-medium text-foreground">No projects found</p>
            <p className="text-xs text-muted-foreground">Try a different search term.</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="pl-5">Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Funding</TableHead>
                  <TableHead className="pr-5 text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id} className="border-border/40">
                    <TableCell className="min-w-[260px] pl-5">
                      <p className="font-medium text-foreground">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.projectType || 'Infrastructure'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide', statusToneClass(project.status))}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[project.location?.city, project.location?.state, project.location?.country].filter(Boolean).join(', ') || 'Unknown'}
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatCurrency(project.funding?.estimatedBudget)}</span>
                          <span>{project.funding?.utilizationPercent ?? 0}%</span>
                        </div>
                        <Progress value={project.funding?.utilizationPercent ?? 0} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Button asChild variant="ghost" size="sm" className="h-7 rounded-xl text-xs">
                        <Link to={`/projects/${project.id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
