import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, footer, children }) => {
  return (
    <div className="min-h-screen bg-background px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_30px_90px_rgba(15,23,42,0.12)] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.22),transparent_34%),linear-gradient(145deg,hsl(var(--card))_0%,color-mix(in_srgb,hsl(var(--primary))_14%,hsl(var(--card)))_100%)] p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,transparent,rgba(255,255,255,0.04))]" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Infra Not-Red
            </div>
            <ThemeToggle />
          </div>

          <div className="relative z-10 max-w-2xl space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-semibold tracking-tight text-foreground xl:text-6xl">
                Infra Not-Red keeps every project view grounded, clear, and accountable.
              </h1>
              <p className="max-w-xl text-base leading-8 text-muted-foreground">
                Keep progress, funding, field updates, and public communication in one place with a calmer Infra Not-Red workspace.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                'Project status and funding in a shared view',
                'Field updates with location-aware evidence',
                'Clearer schedules and risk forecasts',
                'Public-facing transparency pages when needed',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-border/70 bg-background/85 p-4 text-sm font-medium text-foreground backdrop-blur">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground backdrop-blur">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Secure access for owners, managers, and field teams.
          </div>
        </section>

        <section className="flex items-center justify-center bg-card px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Infra Not-Red</p>
              </div>
              <ThemeToggle />
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{subtitle}</p>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-border/70 bg-background/90 p-6 shadow-sm sm:p-7">
              {children}
            </div>

            {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
          </div>
      </section>
      </div>
    </div>
  );
};

export default AuthLayout;
