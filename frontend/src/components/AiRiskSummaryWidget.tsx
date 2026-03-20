import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { PredictionResult } from '../services/aiService';
import { Project } from '../hooks/useProjects';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { riskToneClass } from '@/lib/presentation';

interface AiRiskSummaryWidgetProps {
  projects: Project[];
  predictions: Map<string, PredictionResult>;
  loading: boolean;
  maxHeightClassName?: string;
}

const AiRiskSummaryWidget: React.FC<AiRiskSummaryWidgetProps> = ({
  projects,
  predictions,
  loading,
  maxHeightClassName,
}) => {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    if (predictions.size === 0) return null;

    const values = Array.from(predictions.values());
    const highRiskCount = values.filter((prediction) => prediction.riskLevel === 'High').length;
    const medRiskCount = values.filter((prediction) => prediction.riskLevel === 'Medium').length;

    const sortedProjects = projects
      .filter((project) => predictions.has(project.id))
      .sort((left, right) => {
        const leftPrediction = predictions.get(left.id)!;
        const rightPrediction = predictions.get(right.id)!;
        return (
          rightPrediction.predictedTotalDays - rightPrediction.delayBreakdown.baseTimeline -
          (leftPrediction.predictedTotalDays - leftPrediction.delayBreakdown.baseTimeline)
        );
      })
      .slice(0, 3);

    return {
      highRiskCount,
      medRiskCount,
      totalAnalyzed: predictions.size,
      topRisks: sortedProjects,
    };
  }, [projects, predictions]);

  if (loading) {
    return (
      <Card className={`min-h-[24rem] overflow-hidden border-border/80 ${maxHeightClassName ?? ''}`}>
        <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Preparing forecast summary…</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className={`min-h-[24rem] overflow-hidden border-border/80 ${maxHeightClassName ?? ''}`}>
        <CardHeader>
          <CardTitle>Forecast summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 px-6 py-10 text-center">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Awaiting Project Data</h3>
            <p className="max-w-[240px] text-xs leading-relaxed text-muted-foreground">
              Add target start dates and deadlines to your projects to unlock AI-driven risk analysis and schedule outlooks.
            </p>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-primary">
            <div className="h-1 w-1 animate-pulse rounded-full bg-primary" />
            <span>Ready for analysis</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full min-h-[24rem] overflow-hidden border-border/80 ${maxHeightClassName ?? ''}`}>
      <CardHeader className="shrink-0 gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <CardTitle>Forecast summary</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              A quick read on project pressure and scheduling confidence.
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
            {stats.totalAnalyzed} projects
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 min-h-0 flex-col gap-6 overflow-hidden">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">High risk</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{stats.highRiskCount}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Medium risk</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{stats.medRiskCount}</p>
          </div>
        </div>

        <Separator />

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Projects to review first</p>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="space-y-3">
            {stats.topRisks.map((project) => {
              const prediction = predictions.get(project.id)!;
              const delay = prediction.predictedTotalDays - prediction.delayBreakdown.baseTimeline;

              return (
                <div key={project.id} className="rounded-2xl border border-border/70 bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{project.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {prediction.bottlenecks[0] || 'Review current schedule assumptions'}
                      </p>
                    </div>
                    <Badge className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${riskToneClass(prediction.riskLevel)}`}>
                      {prediction.riskLevel}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{Math.round(prediction.confidenceScore * 100)}% confidence</span>
                    <span className="font-semibold text-foreground">{delay > 0 ? `+${delay} days` : 'On track'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Button onClick={() => navigate('/ai-analysis')} className="mt-auto w-full rounded-xl">
          Open insights
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default AiRiskSummaryWidget;
