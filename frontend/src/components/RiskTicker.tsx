import React, { useEffect, useState } from 'react';
import { BellDot, Dot } from 'lucide-react';

const INSIGHTS = [
  'Labor coverage dipped in NH-48 and needs a supervisor check-in.',
  'Hydropower Project Alpha is consuming materials faster than planned.',
  'Bridge Zone B funding runway moved four days earlier after the last expense cycle.',
  'Monsoon weighting is now reflected in the latest delivery forecasts.',
  'A logistics bottleneck is likely for the next solar shipment window.',
];

const RiskTicker: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % INSIGHTS.length);
        setVisible(true);
      }, 180);
    }, 4200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="soft-panel flex items-center gap-3 overflow-hidden">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
        <BellDot className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Portfolio note
        </p>
        <p
          className={`mt-1 text-sm leading-6 text-foreground transition-all duration-200 ${
            visible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
          }`}
        >
          {INSIGHTS[index]}
        </p>
      </div>
      <div className="flex items-center text-muted-foreground">
        {INSIGHTS.map((_, itemIndex) => (
          <Dot
            key={itemIndex}
            className={`h-5 w-5 ${itemIndex === index ? 'text-primary' : 'text-muted-foreground/40'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default RiskTicker;
