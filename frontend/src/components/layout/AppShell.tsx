import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type NavItem = {
  label: string;
  to: string;
  roles: string[];
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', roles: ['admin', 'owner', 'manager', 'field agent', 'user'] },
  { label: 'Create Project', to: '/projects/create', roles: ['owner'] },
  { label: 'Field Reports', to: '/field-agent/report', roles: ['admin', 'owner', 'field agent'] },
  { label: 'Public Portal', to: '/public', roles: ['admin', 'owner', 'manager', 'field agent', 'user'] },
  { label: 'AI Analytics', to: '/ai-analysis', roles: ['admin', 'owner', 'manager'] },
  { label: 'Funds', to: '/fund-management', roles: ['admin', 'owner', 'manager'] },
];


const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Operations Dashboard', subtitle: 'Track live progress, risk and location insights.' },
  '/projects/create': { title: 'Create Project', subtitle: 'Configure scope, timeline, budget and location details.' },
  '/field-agent/report': { title: 'Field Report Center', subtitle: 'Upload verified on-site updates with geo-coordinates.' },
  '/field-agent/reports': { title: 'Past Field Reports', subtitle: 'Review historical on-site submissions and evidence.' },
  '/public': { title: 'Public Transparency Portal', subtitle: 'Read-only view of infrastructure delivery progress.' },
  '/ai-analysis': { title: 'AI Predictive Intelligence', subtitle: 'Advanced simulation and risk analytics for delivery timelines.' },
  '/fund-management': { title: 'Portfolio Fund Management', subtitle: 'Strategic capital tracking and expenditure analytics.' },
};


const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const role = (user?.role ?? '').toLowerCase();
  const navigation = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const pageMeta = useMemo(() => {
    if (location.pathname.startsWith('/projects/')) {
      return { title: 'Project Workspace', subtitle: 'Detailed project timeline, funding and transaction records.' };
    }
    return PAGE_TITLES[location.pathname] ?? { title: 'Infrastructure Console', subtitle: 'Role-based workspace for delivery teams.' };
  }, [location.pathname]);

  const initials = (user?.role ?? 'U')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (to: string) => {
    if (to === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(to);
  };

  const Sidebar = (
    <aside className="w-72 h-screen sticky top-0 shrink-0 border-r border-slate-200/80 bg-white/90 backdrop-blur-lg flex flex-col">
      <div className="px-6 py-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-[#0f5fa8] text-white font-semibold grid place-items-center">IR</div>
          <div>
            <p className="text-sm font-semibold text-slate-900">InfraRed</p>
          </div>
        </div>
      </div>

      <nav className="px-4 py-6 flex flex-col gap-2">
        {navigation.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={`rounded-xl px-4 py-3 text-sm font-medium transition ${isActive(item.to)
              ? 'bg-[#0f5fa8] text-white shadow-md shadow-blue-200'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-4 mt-auto pb-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">Profile</p>
          <p className="text-sm font-semibold text-slate-900 capitalize">{user?.role ?? 'User'}</p>
          <p className="text-xs muted-text">ID: {user?.user_id ?? 'N/A'}</p>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-transparent">
      <div className="hidden lg:flex lg:flex-col">{Sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-900/45" onClick={() => setMobileOpen(false)} aria-label="close" />
          <div className="relative z-10 h-full max-w-72 bg-white">{Sidebar}</div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-lg px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden h-10 w-10 rounded-lg border border-slate-200 grid place-items-center text-slate-600"
                onClick={() => setMobileOpen(true)}
                aria-label="toggle navigation"
              >
                <span className="text-lg">≡</span>
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">{pageMeta.title}</h1>
                <p className="text-xs md:text-sm muted-text">{pageMeta.subtitle}</p>
              </div>
            </div>

            <div className="relative">
              <button
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 hover:border-slate-300"
                onClick={() => setProfileOpen((prev) => !prev)}
              >
                <div className="h-8 w-8 rounded-lg bg-slate-900 text-white text-xs grid place-items-center">{initials}</div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs text-slate-500">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-800 capitalize">{user?.role ?? 'User'}</p>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Profile management</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 capitalize">{user?.role}</p>
                  <p className="text-xs muted-text mt-1">User ID: {user?.user_id}</p>
                  <p className="text-xs muted-text mt-1">Company: {user?.companyCode || localStorage.getItem('companyCode') || 'Not set'}</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      onClick={() => navigate('/public')}
                    >
                      Open Public View
                    </button>
                    <button
                      className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 md:px-8 py-6 md:py-8">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
