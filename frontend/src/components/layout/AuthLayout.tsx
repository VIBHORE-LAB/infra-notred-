import React from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, footer, children }) => {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-[#f4f7fb]">
      <section className="hidden lg:flex flex-col justify-between bg-[#12385f] text-white p-14 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 h-56 w-56 rounded-full bg-cyan-300/15" />
        <div className="absolute top-40 right-16 h-40 w-40 rounded-full bg-blue-300/20" />
        <div className="absolute bottom-16 right-12 h-56 w-56 rounded-full bg-teal-300/10" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs tracking-wide uppercase">
            InfraRed Enterprise
          </div>
          <h1 className="mt-8 text-5xl leading-tight font-semibold max-w-xl">
            Delivery intelligence for modern infrastructure teams.
          </h1>
          <p className="mt-6 text-base text-blue-100 max-w-lg">
            Unified workspace for project operations, finance transparency, field updates, and risk detection.
          </p>
        </div>

        <div className="relative z-10 text-sm text-blue-100">
          Trusted by project owners, operations managers, and field teams.
        </div>
      </section>

      <section className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md app-surface p-8 md:p-10">
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm muted-text">{subtitle}</p>

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-sm muted-text text-center">{footer}</div>}
        </div>
      </section>
    </div>
  );
};

export default AuthLayout;
