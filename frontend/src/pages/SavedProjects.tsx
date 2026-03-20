import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookmarkCheck, Star } from 'lucide-react';
import { usePublicPortal } from '@/hooks/usePublicPortal';
import { getPublicUserId } from '@/api/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { statusToneClass } from '@/lib/presentation';

const SavedProjects: React.FC = () => {
  const { savedProjects, loadingSavedProjects, error, fetchSavedProjects } = usePublicPortal();

  useEffect(() => {
    void fetchSavedProjects(getPublicUserId());
  }, [fetchSavedProjects]);

  return (
    <div className="min-h-screen bg-background px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="border-border/80">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>My saved projects</CardTitle>
                <CardDescription>
                  Projects bookmarked from the public portal using your local browser identity.
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
        </Card>

        {loadingSavedProjects ? (
          <Card className="border-border/80">
            <CardContent className="flex h-56 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </CardContent>
          </Card>
        ) : savedProjects.length === 0 ? (
          <Card className="border-border/80">
            <CardContent className="space-y-3 p-8 text-center">
              <BookmarkCheck className="mx-auto h-8 w-8 text-primary" />
              <p className="text-lg font-semibold text-foreground">No saved projects yet</p>
              <p className="text-sm text-muted-foreground">
                Use the bookmark button in the public portal to build your saved list.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {savedProjects.map((project) => (
              <Card key={project.id} className="border-border/80">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{project.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {project.location?.city}, {project.location?.state}
                      </p>
                    </div>
                    <Badge className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${statusToneClass(project.status)}`}>
                      {project.status}
                    </Badge>
                  </div>

                  <p className="text-sm leading-6 text-muted-foreground">
                    {project.description || 'No description available.'}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-[hsl(var(--status-warning))]" />
                    Saved {project.savedAt ? new Date(project.savedAt).toLocaleDateString() : 'recently'}
                  </div>

                  <Button asChild className="w-full rounded-2xl">
                    <Link to={`/public/projects/${project.id}`}>Open project</Link>
                  </Button>
                </CardContent>
              </Card>
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

export default SavedProjects;
