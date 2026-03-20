import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ClipboardPlus,
  ClipboardSignature,
  Globe2,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  ScanSearch,
  UserRound,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  to: string;
  roles: string[];
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    roles: ['admin', 'owner', 'manager', 'field agent', 'user'],
    icon: LayoutDashboard,
  },
  { label: 'Create Project', to: '/projects/create', roles: ['owner'], icon: ClipboardPlus },
  {
    label: 'Field Reports',
    to: '/field-agent/report',
    roles: ['admin', 'owner', 'field agent'],
    icon: ClipboardSignature,
  },
  {
    label: 'Public Portal',
    to: '/public',
    roles: ['admin', 'owner', 'manager', 'field agent', 'user'],
    icon: Globe2,
  },
  {
    label: 'My Profile',
    to: '/profile',
    roles: ['admin', 'owner', 'manager', 'field agent', 'user'],
    icon: UserRound,
  },
  { label: 'Insights', to: '/ai-analysis', roles: ['admin', 'owner', 'manager'], icon: BarChart3 },
  { label: 'Funds', to: '/fund-management', roles: ['admin', 'owner', 'manager'], icon: LineChart },
];

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Operations Dashboard',
    subtitle: 'Track portfolio health, delivery signals, and team activity in one place.',
  },
  '/projects/create': {
    title: 'Create Project',
    subtitle: 'Configure scope, timeline, budget, and location details.',
  },
  '/field-agent/report': {
    title: 'Field Report Center',
    subtitle: 'Submit verified on-site updates with location evidence.',
  },
  '/field-agent/reports': {
    title: 'Past Field Reports',
    subtitle: 'Review historical submissions and field proof.',
  },
  '/public': {
    title: 'Public Transparency Portal',
    subtitle: 'Search public projects, ratings, announcements, and community input.',
  },
  '/profile': {
    title: 'My Profile',
    subtitle: 'Manage your identity, contact details, and avatar.',
  },
  '/ai-analysis': {
    title: 'Portfolio Insights',
    subtitle: 'Review delivery forecasts and operational planning signals.',
  },
  '/fund-management': {
    title: 'Fund Management',
    subtitle: 'Track allocation, runway, and spend performance.',
  },
};

const SIDEBAR_W = 'w-56';

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = (user?.role ?? '').toLowerCase();

  const navigation = NAV_ITEMS.filter((item) => item.roles.includes(role)).filter(
    (item, index, items) => items.findIndex((candidate) => candidate.label === item.label) === index
  );

  const pageMeta = useMemo(() => {
    if (location.pathname.startsWith('/projects/')) {
      return {
        title: 'Infra Not-Red Project',
        subtitle: 'Delivery, funding, files, updates, and audit context for the selected project.',
      };
    }

    return (
      PAGE_TITLES[location.pathname] ?? {
        title: 'Infra Not-Red',
        subtitle: 'Role-based workspace for delivery teams.',
      }
    );
  }, [location.pathname]);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || user?.role || 'Team member';
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment.charAt(0))
      .join('')
      .toUpperCase() || 'TM';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (to: string) => {
    if (to === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(to);
  };

  const navLinks = (
    <nav className="flex flex-1 flex-col gap-1 px-2">
      {navigation.map((item) => {
        const active = isActive(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-150',
              active
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
            <span className="truncate">{item.label}</span>
            {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" /> : null}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col py-4">
      <div className="px-4 pb-6">
        <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <ScanSearch className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-foreground">Infra Not-Red</p>
              <p className="truncate text-[11px] text-muted-foreground">Operations Console</p>
            </div>
          </div>
        </div>
      </div>

      {navLinks}

      <div className="flex-1" />

      <div className="px-4 pt-3">
        <div className="flex items-center gap-3 rounded-3xl border border-border/70 bg-card/90 px-3 py-3 shadow-sm">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
            onClick={() => navigate('/profile')}
          >
            <Avatar size="default">
              <AvatarImage src={user?.avatarUrl ?? undefined} alt={displayName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              <p className="truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {user?.role ?? 'user'}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user?.companyCode || localStorage.getItem('companyCode') || 'No company code'}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border/70 bg-background/85 backdrop-blur-md lg:flex',
          SIDEBAR_W
        )}
      >
        {sidebarContent}
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-56">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className={cn('p-0', SIDEBAR_W)}>
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              {sidebarContent}
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-foreground">{pageMeta.title}</h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{pageMeta.subtitle}</p>
          </div>

          <div className="flex items-center gap-1.5">
            <NotificationBell />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => navigate('/public')}
                  aria-label="Public view"
                >
                  <Globe2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Open public transparency portal</TooltipContent>
            </Tooltip>

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
                  <Avatar size="sm">
                    <AvatarImage src={user?.avatarUrl ?? undefined} alt={displayName} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  <p className="truncate font-semibold text-foreground">{displayName}</p>
                  <p className="truncate uppercase tracking-[0.18em]">{user?.role ?? 'user'}</p>
                  <p className="truncate">{user?.email || 'No email'}</p>
                  <p className="truncate">
                    Company: {user?.companyCode || localStorage.getItem('companyCode') || 'Not linked'}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserRound className="mr-2 h-4 w-4" />
                  My profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/public')}>
                  <Globe2 className="mr-2 h-4 w-4" />
                  Public portal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} variant="destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
