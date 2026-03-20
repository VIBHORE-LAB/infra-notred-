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
}

const AiRiskSummaryWidget: React.FC<AiRiskSummaryWidgetProps> = ({ projects, predictions, loading }) => {
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
      <Card className="border-border/80">
        <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Preparing forecast summary…</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Forecast summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>No forecast data is available yet.</p>
          <p>Add projects to unlock schedule outlooks and confidence scores.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-border/80">
      <CardHeader className="gap-4">
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
      <CardContent className="flex h-full flex-col gap-6">
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

        <div className="space-y-4">
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
