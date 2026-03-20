import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Expand } from 'lucide-react';
import { usePublicPortal } from '@/hooks/usePublicPortal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const PublicProjectGallery: React.FC = () => {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const { projectGalleryByProject, loadingGallery, error, fetchProjectGallery } = usePublicPortal();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (projectId) {
      void fetchProjectGallery(projectId, 1, 24);
    }
  }, [fetchProjectGallery, projectId]);

  const galleryData = projectGalleryByProject[projectId];
  const gallery = useMemo(() => galleryData?.gallery ?? [], [galleryData]);
  const selectedImage = selectedImageIndex !== null ? gallery[selectedImageIndex] : null;

  const columns = useMemo(() => gallery.map((item, index) => ({ ...item, index })), [gallery]);

  return (
    <div className="min-h-screen bg-background px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="border-border/80">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>{galleryData?.projectName || 'Project'} photo gallery</CardTitle>
                <CardDescription>
                  Public progress photos from field reports and site visits.
                </CardDescription>
              </div>
              <Button asChild variant="outline" className="rounded-2xl">
                <Link to={`/public/projects/${projectId}`}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to project
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>

        {loadingGallery ? (
          <Card className="border-border/80">
            <CardContent className="flex h-56 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </CardContent>
          </Card>
        ) : gallery.length === 0 ? (
          <Card className="border-border/80">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No public gallery photos are available for this project yet.
            </CardContent>
          </Card>
        ) : (
          <div className="columns-1 gap-4 space-y-4 sm:columns-2 xl:columns-3">
            {columns.map((item) => (
              <button
                key={`${item.reportId}-${item.index}`}
                type="button"
                className="group relative block w-full overflow-hidden rounded-3xl border border-border/70 bg-card"
                onClick={() => setSelectedImageIndex(item.index)}
              >
                <img src={item.url} alt={item.description || 'Project gallery'} className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/65 to-transparent px-4 py-3 text-left text-white">
                  <div>
                    <p className="line-clamp-2 text-sm font-medium">{item.description || 'Site photo'}</p>
                    <p className="mt-1 text-xs text-white/80">
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'No timestamp'}
                    </p>
                  </div>
                  <Expand className="h-4 w-4 shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}

        {galleryData && galleryData.page < galleryData.totalPages ? (
          <div className="flex justify-center">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => void fetchProjectGallery(projectId, galleryData.page + 1, galleryData.limit)}
            >
              Load more
            </Button>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </div>

      <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => setSelectedImageIndex(open ? selectedImageIndex : null)}>
        <DialogContent className="max-w-[min(1200px,calc(100vw-2rem))] rounded-[28px] p-0">
          {selectedImage ? (
            <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="bg-black">
                <img src={selectedImage.url} alt={selectedImage.description || 'Gallery image'} className="max-h-[80vh] w-full object-contain" />
              </div>
              <div className="space-y-4 p-6">
                <p className="text-lg font-semibold text-foreground">{selectedImage.description || 'Project photo'}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedImage.timestamp ? new Date(selectedImage.timestamp).toLocaleString() : 'No timestamp'}
                </p>
                {selectedImage.location ? (
                  <p className="text-sm text-muted-foreground">
                    Lat: {selectedImage.location.latitude ?? '—'}, Lng: {selectedImage.location.longitude ?? '—'}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicProjectGallery;
