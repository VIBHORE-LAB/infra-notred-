import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, Filter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePublicPortal } from '@/hooks/usePublicPortal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CompanyGallery: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCompanyCode = searchParams.get('companyCode') || user?.companyCode || '';
  const [companyCode, setCompanyCode] = useState(initialCompanyCode);
  const [projectFilter, setProjectFilter] = useState('all');
  const { companyGallery, loadingGallery, error, fetchCompanyGallery } = usePublicPortal();

  useEffect(() => {
    if (initialCompanyCode) {
      void fetchCompanyGallery(initialCompanyCode, 1, 24);
    }
  }, [fetchCompanyGallery, initialCompanyCode]);

  const projectOptions = useMemo(() => {
    const names = new Set<string>();
    companyGallery?.gallery.forEach((item) => {
      if (item.projectName) names.add(item.projectName);
    });
    return Array.from(names).sort();
  }, [companyGallery?.gallery]);

  const filteredGallery = useMemo(() => {
    if (!companyGallery?.gallery) return [];
    if (projectFilter === 'all') return companyGallery.gallery;
    return companyGallery.gallery.filter((item) => item.projectName === projectFilter);
  }, [companyGallery?.gallery, projectFilter]);

  const handleLoad = async () => {
    if (!companyCode.trim()) return;
    await fetchCompanyGallery(companyCode.trim(), 1, 24);
    setSearchParams({ companyCode: companyCode.trim() });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="border-border/80">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <CardTitle className="mt-3">Company photo gallery</CardTitle>
                <CardDescription>
                  Browse all public project photos for a company and optionally filter by project.
                </CardDescription>
              </div>
              <Button asChild variant="outline" className="rounded-2xl">
                <Link to="/public">
                  <ArrowLeft className="h-4 w-4" />
                  Back to portal
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 xl:grid-cols-[1fr_220px_auto]">
            <Input
              value={companyCode}
              onChange={(event) => setCompanyCode(event.target.value)}
              placeholder="Enter company code"
              className="h-11 rounded-2xl"
            />
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projectOptions.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="rounded-2xl" onClick={() => void handleLoad()}>
              <Filter className="h-4 w-4" />
              Load gallery
            </Button>
          </CardContent>
        </Card>

        {loadingGallery ? (
          <Card className="border-border/80">
            <CardContent className="flex h-56 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </CardContent>
          </Card>
        ) : filteredGallery.length === 0 ? (
          <Card className="border-border/80">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No company gallery photos are available for the current company code or project filter.
            </CardContent>
          </Card>
        ) : (
          <div className="columns-1 gap-4 space-y-4 sm:columns-2 xl:columns-3">
            {filteredGallery.map((item) => (
              <div key={`${item.reportId}-${item.url}`} className="overflow-hidden rounded-3xl border border-border/70 bg-card">
                <img src={item.url} alt={item.description || item.projectName || 'Company gallery'} className="w-full object-cover" />
                <div className="space-y-2 p-4">
                  <p className="text-sm font-semibold text-foreground">{item.projectName || 'Project'}</p>
                  <p className="text-sm text-muted-foreground">{item.description || 'Site photo'}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'No timestamp'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CompanyGallery;
