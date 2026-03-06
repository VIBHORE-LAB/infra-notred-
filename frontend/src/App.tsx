import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import PublicPortal from './pages/PublicPortal';
import PublicProjectThread from './pages/public/PublicProjectThread';
import CreateProject from './pages/projects/CreateProject';
import ProjectDetail from './pages/projects/ProjectDetail';
import ProgressReportForm from './pages/field-agent/ProgressReportForm';
import PastFieldReports from './pages/field-agent/PastFieldReports';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import AiDetailedAnalysis from './pages/AiDetailedAnalysis';
import FundManagement from './pages/FundManagement';


const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/public" element={<PublicPortal />} />
          <Route path="/public/projects/:projectId" element={<PublicProjectThread />} />

          {/* Protected: all authenticated roles */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'owner', 'manager', 'field agent', 'user']}>
                <AppShell>
                  <Dashboard />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Protected: project management (owner only) */}
          <Route
            path="/projects/create"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <AppShell>
                  <CreateProject />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <ProtectedRoute allowedRoles={['admin', 'owner', 'manager']}>
                <AppShell>
                  <ProjectDetail />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Protected: field agent only */}
          <Route
            path="/field-agent/report"
            element={
              <ProtectedRoute allowedRoles={['field agent', 'admin', 'owner']}>
                <AppShell>
                  <ProgressReportForm />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/field-agent/reports"
            element={
              <ProtectedRoute allowedRoles={['field agent', 'admin', 'owner']}>
                <AppShell>
                  <PastFieldReports />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-analysis"
            element={
              <ProtectedRoute allowedRoles={['admin', 'owner', 'manager']}>
                <AppShell>
                  <AiDetailedAnalysis />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fund-management"
            element={
              <ProtectedRoute allowedRoles={['admin', 'owner', 'manager']}>
                <AppShell>
                  <FundManagement />
                </AppShell>
              </ProtectedRoute>
            }
          />
        </Routes>

      </Router>
    </AuthProvider>
  );
};

export default App;
