import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseService';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
    const { user, userRole, loading, isAuthenticated } = useAuth();

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
 * Does NOT rely on AuthContext isAgency (which can have race conditions).
 * Performs its own fresh database check every time.
 */
export const AgencyRoute = ({ children }) => {
    const { user, realUser, loading: authLoading, isAuthenticated, isImpersonating, stopImpersonating } = useAuth();
    const [agencyVerified, setAgencyVerified] = useState(null);

    // Always use the REAL user ID, never the impersonated client
    const agencyUserId = realUser?.id || user?.id;

    useEffect(() => {
        // ONLY stop stale impersonation when ENTERING the agency panel (mount only).
        // Do NOT watch isImpersonating changes — that would cancel impersonation
        // immediately when the agency clicks "Manage as Client"!
        if (isImpersonating) {
            console.log('AgencyRoute: Clearing stale impersonation on mount');
            stopImpersonating();
        }
    }, []); // ← Empty deps: runs ONCE on mount only

    useEffect(() => {
        if (!agencyUserId) {
            setAgencyVerified(false);
            return;
        }

        // Direct DB check using REAL user ID
        supabase
            .from('profiles')
            .select('is_agency')
            .eq('id', agencyUserId)
            .maybeSingle()
            .then(({ data, error }) => {
                if (error) {
                    console.error('AgencyRoute DB check error:', error.message);
                    setAgencyVerified(false);
                } else {
                    const result = !!data?.is_agency;
                    console.log(`AgencyRoute: DB check → is_agency=${result} for ${agencyUserId}`);
                    setAgencyVerified(result);
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
        console.warn(`AgencyRoute: Denied — user ${agencyUserId} is not an agency`);
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
