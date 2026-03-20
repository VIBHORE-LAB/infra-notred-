import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectRatingSummaryProps {
  averageRating?: number | null;
  totalRatings?: number | null;
  compact?: boolean;
}

const ProjectRatingSummary: React.FC<ProjectRatingSummaryProps> = ({
  averageRating,
  totalRatings,
  compact = false,
}) => {
  const rating = Number(averageRating ?? 0);
  const count = Number(totalRatings ?? 0);

  return (
    <div className={cn('flex items-center gap-2 text-sm', compact ? 'text-xs' : 'text-sm')}>
      <div className="flex items-center gap-1 font-semibold text-foreground">
        <Star className="h-4 w-4 fill-current text-[hsl(var(--status-warning))]" />
        <span>{rating > 0 ? rating.toFixed(1) : '0.0'}</span>
        <span className="text-muted-foreground">/ 5</span>
      </div>
      <span className="text-muted-foreground">
        {count > 0 ? `from ${count} rating${count === 1 ? '' : 's'}` : 'No ratings yet'}
      </span>
    </div>
  );
};

export default ProjectRatingSummary;
