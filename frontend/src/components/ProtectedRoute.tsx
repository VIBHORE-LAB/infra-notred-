import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { JSX } from 'react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
    children: JSX.Element;
    allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, token } = useAuth();
    const location = useLocation();

    if (!token) {
        // Not logged in, redirect to login page with the return url
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user) {
        const userRole = user.role.toLowerCase();
        const hasRole = allowedRoles.map(r => r.toLowerCase()).includes(userRole);
        if (!hasRole) {
            // role not authorized
            return (
                <div className="flex min-h-screen items-center justify-center px-4">
                    <div className="app-surface max-w-lg p-8 text-center">
                        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Access denied</h1>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            You do not have the required role to view this page.
                        </p>
                        <Button
                            onClick={() => window.location.assign('/dashboard')}
                            className="mt-6 rounded-xl"
                        >
                            Return to dashboard
                        </Button>
                    </div>
                </div>
            );
        }
    }

    return children;
};
