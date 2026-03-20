import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CircleAlert, Landmark, ReceiptText, TrendingUp, Wallet } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/presentation';

const FundManagement: React.FC = () => {
  const { fetchAllProjects, projects, loading: projectsLoading } = useProjects();

  useEffect(() => {
    void fetchAllProjects();
  }, [fetchAllProjects]);

  const portfolioStats = useMemo(() => {
    if (projects.length === 0) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        avgUtilization: 0,
        atRiskCount: 0,
      };
    }

    const totalBudget = projects.reduce((sum, project) => sum + (project.funding?.estimatedBudget || 0), 0);
    const totalSpent = projects.reduce(
      (sum, project) => sum + ((project.funding?.estimatedBudget || 0) * (project.funding?.utilizationPercent || 0)) / 100,
      0
    );
    const avgUtilization = Math.round(
      projects.reduce((sum, project) => sum + (project.funding?.utilizationPercent || 0), 0) / projects.length
    );
    const atRiskCount = projects.filter((project) => (project.funding?.utilizationPercent || 0) > 85).length;

    return { totalBudget, totalSpent, avgUtilization, atRiskCount };
  }, [projects]);

  return (
    <div className="page-grid">
      <Card className="border-border/80">
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Fund management</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Review allocation, utilization, and budget pressure across active projects.
              </p>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
              {projects.length} active budgets
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total budget', value: formatCurrency(portfolioStats.totalBudget), icon: Wallet },
            { label: 'Estimated spend', value: formatCurrency(portfolioStats.totalSpent), icon: Landmark },
            { label: 'Average utilization', value: `${portfolioStats.avgUtilization}%`, icon: TrendingUp },
            { label: 'Budget alerts', value: portfolioStats.atRiskCount, icon: CircleAlert },
          ].map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{metric.label}</span>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-semibold tracking-tight text-foreground">{metric.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Project ledger view</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Compare project allocation, estimated spending, and budget pressure.
              </p>
            </div>
            <ReceiptText className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </div>
          ) : projects.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 text-center">
              <p className="text-sm font-medium text-foreground">No project budgets available yet.</p>
              <p className="text-sm text-muted-foreground">Create a project to start tracking spending.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Estimated spend</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  const utilization = project.funding?.utilizationPercent || 0;
                  const estimatedSpent = ((project.funding?.estimatedBudget || 0) * utilization) / 100;
                  const alertClass =
                    utilization > 85 ? 'status-danger' : utilization > 60 ? 'status-progress' : 'status-success';

                  return (
                    <TableRow key={project.id}>
                      <TableCell className="min-w-[220px]">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">{project.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {project.projectType || 'Infrastructure'} • {project.location?.city || 'Unknown location'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(project.funding?.estimatedBudget)}</TableCell>
                      <TableCell>{formatCurrency(estimatedSpent)}</TableCell>
                      <TableCell className="min-w-[180px]">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{utilization}%</span>
                            <Badge className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${alertClass}`}>
                              {utilization > 85 ? 'Alert' : utilization > 60 ? 'Watch' : 'Healthy'}
                            </Badge>
                          </div>
                          <Progress value={utilization} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/projects/${project.id}`} className="text-sm font-medium text-primary hover:underline">
                          View project
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FundManagement;
