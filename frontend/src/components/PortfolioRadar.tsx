import React from 'react';
import { Badge } from '@/components/ui/badge';
import { riskToneClass } from '@/lib/presentation';

interface RadarData {
  name: string;
  metrics: {
    budgetAdherence: number;
    scheduleVelocity: number;
    laborDensity: number;
    riskMitigation: number;
  };
  riskLevel: 'High' | 'Medium' | 'Low';
}

interface PortfolioRadarProps {
  projects: RadarData[];
}

const fillColorForRisk = (riskLevel: RadarData['riskLevel']) => {
  switch (riskLevel) {
    case 'High':
      return 'hsl(var(--status-danger) / 0.14)';
    case 'Medium':
      return 'hsl(var(--status-warning) / 0.14)';
    case 'Low':
      return 'hsl(var(--status-success) / 0.14)';
    default:
      return 'hsl(var(--primary) / 0.12)';
  }
};

const strokeColorForRisk = (riskLevel: RadarData['riskLevel']) => {
  switch (riskLevel) {
    case 'High':
      return 'hsl(var(--status-danger))';
    case 'Medium':
      return 'hsl(var(--status-warning))';
    case 'Low':
      return 'hsl(var(--status-success))';
    default:
      return 'hsl(var(--primary))';
  }
};

const PortfolioRadar: React.FC<PortfolioRadarProps> = ({ projects }) => {
  const size = 300;
  const center = size / 2;
  const maxVal = 100;
  const radius = size / 2 - 40;

  const getPoint = (val: number, angle: number) => {
    const pointRadius = (val / maxVal) * radius;
    return {
      x: center + pointRadius * Math.cos(angle),
      y: center + pointRadius * Math.sin(angle),
    };
  };

  const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
  const labels = ['Budget', 'Velocity', 'Labor', 'Mitigation'];

  return (
    <div className="app-surface p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="section-title">Portfolio comparison</h3>
          <p className="section-copy mt-1">A quick view of where each project is strongest or under pressure.</p>
        </div>
        <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
          {projects.length} projects
        </Badge>
      </div>

      <div className="flex flex-col items-center gap-8 xl:flex-row xl:items-start">
        <div className="flex justify-center">
          <svg width={size} height={size} className="overflow-visible">
            {[0.2, 0.4, 0.6, 0.8, 1].map((ring, index) => (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius * ring}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
            ))}

            {angles.map((angle, index) => {
              const point = getPoint(100, angle);
              return (
                <line
                  key={index}
                  x1={center}
                  y1={center}
                  x2={point.x}
                  y2={point.y}
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                />
              );
            })}

            {labels.map((label, index) => {
              const point = getPoint(115, angles[index]);
              return (
                <text
                  key={label}
                  x={point.x}
                  y={point.y}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  className="fill-muted-foreground text-[11px] font-medium"
                >
                  {label}
                </text>
              );
            })}

            {projects.map((project, index) => {
              const values = [
                project.metrics.budgetAdherence,
                project.metrics.scheduleVelocity,
                project.metrics.laborDensity,
                project.metrics.riskMitigation,
              ];

              const points = angles.map((angle, pointIndex) => getPoint(values[pointIndex], angle));
              const path = `${points
                .map((point, pointIndex) => `${pointIndex === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
                .join(' ')} Z`;

              return (
                <path
                  key={`${project.name}-${index}`}
                  d={path}
                  fill={fillColorForRisk(project.riskLevel)}
                  stroke={strokeColorForRisk(project.riskLevel)}
                  strokeWidth="2"
                  strokeDasharray={index === 0 ? '0' : '5 4'}
                />
              );
            })}
          </svg>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 xl:min-w-[260px] xl:grid-cols-1">
          {projects.map((project) => (
            <div key={project.name} className="soft-panel">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-foreground">{project.name}</p>
                <Badge className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${riskToneClass(project.riskLevel)}`}>
                  {project.riskLevel}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>Budget {project.metrics.budgetAdherence}%</span>
                <span>Velocity {project.metrics.scheduleVelocity}%</span>
                <span>Labor {project.metrics.laborDensity}%</span>
                <span>Mitigation {project.metrics.riskMitigation}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioRadar;
