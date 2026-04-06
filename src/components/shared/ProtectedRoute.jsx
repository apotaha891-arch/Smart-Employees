import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseService';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
    const { user, userRole, loading, isAuthenticated, isImpersonating } = useAuth();

    if (loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <p>Loading...</p>
        </div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If a specific role is required, check if user has it
    if (requiredRole && userRole !== requiredRole) {
        // If it's an admin in impersonation mode, allow entry to client dashboard
        if (userRole === 'admin' && isImpersonating) {
            return children;
        }

        if (userRole === 'admin') {
            return <Navigate to="/admin" replace />;
        } else {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};

/**
 * AgencyRoute: Strict guard that directly verifies agency status from DB.
 */
export const AgencyRoute = ({ children }) => {
    const { user, realUser, loading: authLoading, isAuthenticated, isImpersonating, stopImpersonating } = useAuth();
    const [agencyVerified, setAgencyVerified] = useState(null);

    // Always use the REAL user ID
    const agencyUserId = realUser?.id || user?.id;

    useEffect(() => {
        if (isImpersonating) {
            console.log('AgencyRoute: Clearing stale impersonation on mount');
            stopImpersonating();
        }
    }, []);

    useEffect(() => {
        if (!agencyUserId) {
            setAgencyVerified(false);
            return;
        }

        supabase
            .from('profiles')
            .select('is_agency')
            .eq('id', agencyUserId)
            .maybeSingle()
            .then(({ data, error }) => {
                if (error) {
                    setAgencyVerified(false);
                } else {
                    setAgencyVerified(!!data?.is_agency);
                }
            });
    }, [agencyUserId]);

    if (authLoading || agencyVerified === null) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: '#09090b', color: 'white',
                flexDirection: 'column', gap: '1rem'
            }}>
                <div style={{
                    width: '40px', height: '40px',
                    border: '3px solid #8B5CF6',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Verifying agency access...</p>
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (!agencyVerified) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
