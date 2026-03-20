import React, { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ProjectRatings } from '@/hooks/usePublicPortal';
import ProjectRatingSummary from './ProjectRatingSummary';
import { cn } from '@/lib/utils';

const DEFAULT_SENTIMENTS = ['Great', 'Needed', 'Delayed', 'Wasteful', 'Excellent', 'Poor'];

interface ProjectRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  ratings?: ProjectRatings | null;
  loading?: boolean;
  submitting?: boolean;
  onSubmit: (payload: { stars: number; sentimentTag?: string }) => Promise<boolean | void> | boolean | void;
  onOpen?: () => Promise<unknown> | unknown;
}

const ProjectRatingDialog: React.FC<ProjectRatingDialogProps> = ({
  open,
  onOpenChange,
  projectName,
  ratings,
  loading = false,
  submitting = false,
  onSubmit,
  onOpen,
}) => {
  const [stars, setStars] = useState(5);
  const [sentimentTag, setSentimentTag] = useState('');

  useEffect(() => {
    if (open) {
      void onOpen?.();
    }
  }, [onOpen, open]);

  const sentiments = useMemo(
    () => (ratings?.validSentimentTags?.length ? ratings.validSentimentTags : DEFAULT_SENTIMENTS),
    [ratings?.validSentimentTags]
  );

  const distribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((value) => ({
        label: `${value} star`,
        count: Number(ratings?.distribution?.[String(value)] ?? 0),
        percent:
          Number(ratings?.totalRatings ?? 0) > 0
            ? (Number(ratings?.distribution?.[String(value)] ?? 0) / Number(ratings?.totalRatings ?? 1)) * 100
            : 0,
      })),
    [ratings?.distribution, ratings?.totalRatings]
  );

  const handleSubmit = async () => {
    const result = await onSubmit({ stars, sentimentTag: sentimentTag || undefined });
    if (result !== false) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[28px] p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle>Rate {projectName}</DialogTitle>
          <DialogDescription>
            Share a quick public rating and how the project feels from your perspective.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 px-6 py-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
              <ProjectRatingSummary
                averageRating={ratings?.averageRating}
                totalRatings={ratings?.totalRatings}
              />
            </div>

            <div className="space-y-3">
              <Label>Your star rating</Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((value) => {
                  const active = value <= stars;
                  return (
                    <Button
                      key={value}
                      type="button"
                      variant={active ? 'default' : 'outline'}
                      className={cn('rounded-2xl px-4', active ? '' : 'text-muted-foreground')}
                      onClick={() => setStars(value)}
                    >
                      <Star className={cn('h-4 w-4', active ? 'fill-current' : '')} />
                      {value}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Sentiment tag</Label>
              <div className="flex flex-wrap gap-2">
                {sentiments.map((item) => (
                  <Button
                    key={item}
                    type="button"
                    variant={sentimentTag === item ? 'default' : 'outline'}
                    className="rounded-full"
                    onClick={() => setSentimentTag((current) => (current === item ? '' : item))}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>

            <Button className="w-full rounded-2xl" disabled={submitting} onClick={() => void handleSubmit()}>
              Submit rating
            </Button>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">Rating distribution</p>
              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {distribution.map((item) => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{item.label}</span>
                        <span>{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">Sentiment snapshot</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(ratings?.sentimentBreakdown ?? {}).length > 0 ? (
                  Object.entries(ratings?.sentimentBreakdown ?? {}).map(([label, count]) => (
                    <span
                      key={label}
                      className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground"
                    >
                      {label}: {count}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No sentiment tags submitted yet.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectRatingDialog;
