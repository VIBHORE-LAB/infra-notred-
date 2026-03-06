import React from 'react';
import { Typography } from '@mui/material';

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

const PortfolioRadar: React.FC<PortfolioRadarProps> = ({ projects }) => {
    // A simplified "Radar" using SVG circles and lines to create a premium feel without external heavy chart libs
    const size = 300;
    const center = size / 2;
    const maxVal = 100;
    const radius = size / 2 - 40;

    const getPoint = (val: number, angle: number) => {
        const r = (val / maxVal) * radius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return { x, y };
    };

    const angles = [
        -Math.PI / 2, // Top: Budget
        0,            // Right: Velocity
        Math.PI / 2,  // Bottom: Labor
        Math.PI       // Left: Mitigation
    ];

    const labels = ["Budget", "Velocity", "Labor", "Mitigation"];

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden flex flex-col items-center">
            <Typography variant="subtitle1" className="font-bold text-slate-900 mb-6 text-center">Portfolio Comparative Risk Radar</Typography>

            <div className="relative">
                <svg width={size} height={size} className="overflow-visible">
                    {/* Background rings */}
                    {[0.2, 0.4, 0.6, 0.8, 1].map((r, i) => (
                        <circle
                            key={i}
                            cx={center}
                            cy={center}
                            r={radius * r}
                            fill="none"
                            stroke="#f1f5f9"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Axis lines */}
                    {angles.map((angle, i) => {
                        const p = getPoint(100, angle);
                        return (
                            <line
                                key={i}
                                x1={center}
                                y1={center}
                                x2={p.x}
                                y2={p.y}
                                stroke="#f1f5f9"
                                strokeWidth="1"
                            />
                        );
                    })}

                    {/* Labels */}
                    {labels.map((label, i) => {
                        const p = getPoint(115, angles[i]);
                        return (
                            <text
                                key={i}
                                x={p.x}
                                y={p.y}
                                textAnchor="middle"
                                alignmentBaseline="middle"
                                className="text-[10px] font-bold fill-slate-400 uppercase tracking-tighter"
                            >
                                {label}
                            </text>
                        );
                    })}

                    {/* Project Shapes */}
                    {projects.map((proj, pIdx) => {
                        const vals = [
                            proj.metrics.budgetAdherence,
                            proj.metrics.scheduleVelocity,
                            proj.metrics.laborDensity,
                            proj.metrics.riskMitigation
                        ];

                        const points = angles.map((angle, i) => getPoint(vals[i], angle));
                        const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

                        const color = proj.riskLevel === 'High' ? '#e11d48' : proj.riskLevel === 'Medium' ? '#f59e0b' : '#4f46e5';

                        return (
                            <path
                                key={pIdx}
                                d={d}
                                fill={color}
                                fillOpacity="0.1"
                                stroke={color}
                                strokeWidth="2"
                                strokeDasharray={pIdx === 0 ? "0" : "4 2"}
                                className="transition-all duration-1000"
                            />
                        );
                    })}
                </svg>

                {/* Legend */}
                <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-2 w-full max-w-[240px]">
                    {projects.map((proj, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${proj.riskLevel === 'High' ? 'bg-rose-500' : proj.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                            <span className="text-[10px] font-bold text-slate-700 truncate">{proj.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PortfolioRadar;
