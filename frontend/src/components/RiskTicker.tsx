import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const INSIGHTS = [
    "AI detect unusual labor density drop in NH-48 sector. Investigating schedule variance.",
    "Hydropower Project Alpha showing 12% faster material consumption than predicted. Efficiency gain detected.",
    "Bridges Zone B: Burn rate anomaly. Projected fund exhaustion shifted 4 days earlier.",
    "Intelligence Model V4 updated. Prediction confidence increased to 94% across Portfolio.",
    "Environmental risk weights adjusted for monsoon season in North India projects.",
    "Smart Allocation recommendation: Shift 5 laborers from 'On-Track' Green Park to 'Delayed' NH-48.",
    "Predictive Heuristics detect possible logistics bottleneck at Mundra Port for Solar Farm units."
];

const RiskTicker: React.FC = () => {
    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setIndex((prev) => (prev + 1) % INSIGHTS.length);
                setFade(true);
            }, 500);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-slate-900 text-white py-3 px-6 rounded-2xl flex items-center gap-4 overflow-hidden shadow-2xl shadow-blue-900/20 border border-slate-800">
            <div className="flex items-center gap-2 whitespace-nowrap border-r border-slate-700 pr-4">
                <AutoGraphIcon className="text-blue-400 text-sm" />
                <Typography className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Live AI Feed</Typography>
            </div>

            <div className={`flex-1 transition-all duration-500 transform ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <div className="flex items-center gap-2 font-medium">
                    <WarningAmberIcon className="text-amber-400 text-sm" />
                    <p className="text-xs text-slate-300 italic">
                        {INSIGHTS[index]}
                    </p>
                </div>
            </div>

            <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
            </div>
        </div>
    );
};

export default RiskTicker;
