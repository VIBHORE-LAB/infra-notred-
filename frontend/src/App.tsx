import * as React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageLoader from '@/components/PageLoader';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import ThemeProvider from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/context/AuthContext';

const Register = React.lazy(() => import('@/pages/auth/Register'));
const Login = React.lazy(() => import('@/pages/auth/Login'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const PublicPortal = React.lazy(() => import('@/pages/PublicPortal'));
const PublicProjectThread = React.lazy(() => import('@/pages/public/PublicProjectThread'));
const PublicMap = React.lazy(() => import('@/pages/PublicMap'));
const SavedProjects = React.lazy(() => import('@/pages/SavedProjects'));
const PublicProjectGallery = React.lazy(() => import('@/pages/PublicProjectGallery'));
const CompanyGallery = React.lazy(() => import('@/pages/CompanyGallery'));
const CreateProject = React.lazy(() => import('@/pages/projects/CreateProject'));
const ProjectDetail = React.lazy(() => import('@/pages/projects/ProjectDetail'));
const ProgressReportForm = React.lazy(() => import('@/pages/field-agent/ProgressReportForm'));
const PastFieldReports = React.lazy(() => import('@/pages/field-agent/PastFieldReports'));
const AiDetailedAnalysis = React.lazy(() => import('@/pages/AiDetailedAnalysis'));
const FundManagement = React.lazy(() => import('@/pages/FundManagement'));
const Profile = React.lazy(() => import('@/pages/Profile'));

const RouteFallback = ({ label }: { label?: string }) => (
  <PageLoader label={label} />
);

const LazyPage = ({
  Page,
  label,
}: {
  Page: React.LazyExoticComponent<React.ComponentType>;
  label?: string;
}) => (
  <React.Suspense fallback={<RouteFallback label={label} />}>
    <Page />
  </React.Suspense>
);

const ProtectedPage = ({
  Page,
  allowedRoles,
  label,
}: {
  Page: React.LazyExoticComponent<React.ComponentType>;
  allowedRoles: string[];
  label?: string;
}) => (
  <ProtectedRoute allowedRoles={allowedRoles}>
    <AppShell>
      <LazyPage Page={Page} label={label} />
    </AppShell>
  </ProtectedRoute>
);

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/register" element={<LazyPage Page={Register} label="Opening registration…" />} />
              <Route path="/login" element={<LazyPage Page={Login} label="Opening sign-in…" />} />
              <Route path="/public" element={<LazyPage Page={PublicPortal} label="Loading public portal…" />} />
              <Route path="/saved-projects" element={<LazyPage Page={SavedProjects} label="Loading saved projects…" />} />
              <Route
                path="/public/projects/:projectId"
                element={<LazyPage Page={PublicProjectThread} label="Loading project detail…" />}
              />
              <Route
                path="/projects/:projectId/gallery"
                element={<LazyPage Page={PublicProjectGallery} label="Loading gallery…" />}
              />
              <Route
                path="/gallery/company"
                element={<LazyPage Page={CompanyGallery} label="Loading company gallery…" />}
              />
              <Route path="/map" element={<LazyPage Page={PublicMap} label="Loading map…" />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedPage
                    Page={Dashboard}
                    allowedRoles={['admin', 'owner', 'manager', 'field agent', 'user']}
                    label="Loading dashboard…"
                  />
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedPage
                    Page={Dashboard}
                    allowedRoles={['admin', 'owner', 'manager', 'field agent', 'user']}
                    label="Loading projects…"
                  />
                }
              />
              <Route
                path="/projects/create"
                element={
                  <ProtectedPage
                    Page={CreateProject}
                    allowedRoles={['owner']}
                    label="Loading project setup…"
                  />
                }
              />
              <Route
                path="/projects/:projectId"
                element={
                  <ProtectedPage
                    Page={ProjectDetail}
                    allowedRoles={['admin', 'owner', 'manager']}
                    label="Loading project workspace…"
                  />
                }
              />
              <Route
                path="/field-agent/report"
                element={
                  <ProtectedPage
                    Page={ProgressReportForm}
                    allowedRoles={['field agent', 'admin', 'owner']}
                    label="Loading field reporting…"
                  />
                }
              />
              <Route
                path="/field-agent/reports"
                element={
                  <ProtectedPage
                    Page={PastFieldReports}
                    allowedRoles={['field agent', 'admin', 'owner']}
                    label="Loading field reports…"
                  />
                }
              />
              <Route
                path="/ai-analysis"
                element={
                  <ProtectedPage
                    Page={AiDetailedAnalysis}
                    allowedRoles={['admin', 'owner', 'manager']}
                    label="Loading insights…"
                  />
                }
              />
              <Route
                path="/fund-management"
                element={
                  <ProtectedPage
                    Page={FundManagement}
                    allowedRoles={['admin', 'owner', 'manager']}
                    label="Loading fund management…"
                  />
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedPage
                    Page={Profile}
                    allowedRoles={['admin', 'owner', 'manager', 'field agent', 'user']}
                    label="Loading profile…"
                  />
                }
              />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <Toaster position="bottom-right" richColors closeButton />
          </Router>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
