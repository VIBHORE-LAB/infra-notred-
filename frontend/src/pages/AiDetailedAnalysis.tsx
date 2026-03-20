import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useProjects } from '../hooks/useProjects';
import { batchPredictProjects, PredictionResult, simulateProjectImpact, SimulationImpact } from '../services/aiService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { riskToneClass } from '@/lib/presentation';

const AiDetailedAnalysis: React.FC = () => {
  const { fetchAllProjects, projects, loading: projectsLoading } = useProjects();
  const [predictions, setPredictions] = useState<Map<string, PredictionResult>>(new Map());
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [deltaTeamsize, setDeltaTeamsize] = useState(0);
  const [deltaUtilization, setDeltaUtilization] = useState(0);
  const [simulation, setSimulation] = useState<SimulationImpact | null>(null);
  const [simulationLoading, setSimulationLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const list = await fetchAllProjects();
      if (list.length > 0) {
        setLoading(true);
        const result = await batchPredictProjects(list);
        setPredictions(result);
        setSelectedProjectId(list[0].id);
        setLoading(false);
      }
    };
    void init();
  }, [fetchAllProjects]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );
  const selectedPrediction = useMemo(
    () => (selectedProjectId ? predictions.get(selectedProjectId) || null : null),
    [predictions, selectedProjectId]
  );

  const summary = useMemo(() => {
    if (predictions.size === 0) return null;
    const values = Array.from(predictions.values());
    return {
      highRisk: values.filter((prediction) => prediction.riskLevel === 'High').length,
      mediumRisk: values.filter((prediction) => prediction.riskLevel === 'Medium').length,
      averageConfidence:
        values.reduce((sum, prediction) => sum + prediction.confidenceScore, 0) / values.length,
    };
  }, [predictions]);

  const runSimulation = async () => {
    if (!selectedProjectId) {
      toast.error('Choose a project first.');
      return;
    }
    setSimulationLoading(true);
    const result = await simulateProjectImpact(selectedProjectId, deltaTeamsize, deltaUtilization);
    setSimulation(result);
    setSimulationLoading(false);
    if (result) {
      toast.success('Scenario updated.');
    } else {
      toast.error('Unable to run the scenario.');
    }
  };

  return (
    <div className="page-grid">
      <Card className="border-border/80">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Portfolio insights</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Use this view to review likely delay risk, confidence, and simple scenario changes.
              </p>
            </div>
            {summary && (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">High risk</p>
                  <p className="mt-1 font-semibold text-foreground">{summary.highRisk}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Medium risk</p>
                  <p className="mt-1 font-semibold text-foreground">{summary.mediumRisk}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Avg confidence</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {Math.round((summary.averageConfidence || 0) * 100)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>Project list</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectsLoading || loading ? (
              <div className="flex h-56 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              </div>
            ) : (
              projects.map((project) => {
                const prediction = predictions.get(project.id);
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                      project.id === selectedProjectId
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/70 bg-background hover:bg-muted/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{project.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {project.projectType || 'Infrastructure'} • {project.location?.city || 'Unknown location'}
                        </p>
                      </div>
                      {prediction && (
                        <Badge className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${riskToneClass(prediction.riskLevel)}`}>
                          {prediction.riskLevel}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle>{selectedProject?.name || 'Select a project'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {selectedProject && selectedPrediction ? (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${riskToneClass(selectedPrediction.riskLevel)}`}>
                      {selectedPrediction.riskLevel} risk
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(selectedPrediction.confidenceScore * 100)}% confidence
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Confidence</span>
                      <span>{Math.round(selectedPrediction.confidenceScore * 100)}%</span>
                    </div>
                    <Progress value={selectedPrediction.confidenceScore * 100} className="h-2" />
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Delay reasoning</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">{selectedPrediction.delayReasoning}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {selectedPrediction.bottlenecks.map((bottleneck) => (
                      <div key={bottleneck} className="rounded-2xl border border-border/70 bg-background p-4 text-sm text-foreground">
                        {bottleneck}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Select a project to review its outlook.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Scenario planning</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Try small changes in team size and utilization, then compare the projected impact.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Team change</label>
                  <Input type="number" value={deltaTeamsize} onChange={(event) => setDeltaTeamsize(Number(event.target.value))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Utilization change</label>
                  <Input type="number" value={deltaUtilization} onChange={(event) => setDeltaUtilization(Number(event.target.value))} />
                </div>
              </div>

              <Button onClick={runSimulation} disabled={simulationLoading} className="rounded-xl">
                {simulationLoading ? 'Running scenario…' : 'Run scenario'}
              </Button>

              {simulation && (
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    Result
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Days saved</p>
                      <p className="mt-2 text-xl font-semibold text-foreground">{simulation.impact.daysSaved}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Risk change</p>
                      <p className="mt-2 text-xl font-semibold text-foreground">{simulation.impact.riskChange}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AiDetailedAnalysis;
