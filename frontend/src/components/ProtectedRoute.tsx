import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { JSX } from 'react';
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
                <div className="flex items-center justify-center h-screen px-4">
                    <div className="app-surface text-center p-8 max-w-lg text-slate-800">
                        <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
                        <p className="mb-4 text-sm text-slate-600">You do not have the required role to view this page.</p>
                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="px-4 py-2 bg-[#0f5fa8] text-white rounded-lg hover:bg-[#0d528f]"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            );
        }
    }

    return children;
};
