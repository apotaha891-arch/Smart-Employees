import { useState, useEffect, useContext, createContext } from 'react';
import { getCurrentUser, getProfile } from '../services/supabaseService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

// Helper function to determine user role
const determineUserRole = async (authUser) => {
    // Check if user is admin (hardcoded for now - TODO: add role field to profiles table)
    const adminEmails = ['admin@example.com', 'admin@agentic.com'];
    if (adminEmails.includes(authUser?.email)) {
        return 'admin';
    }

    // Try to fetch role from profile if available
    try {
        if (authUser?.id) {
            const profileResult = await getProfile(authUser.id);
            if (profileResult.success && profileResult.data?.role) {
                return profileResult.data.role;
            }
        }
    } catch (error) {
        console.warn('Could not fetch role from profile:', error);
    }

    // Default to customer role for all authenticated users
    return 'customer';
};

export const createAuthProvider = () => {
    return function AuthProvider({ children }) {
        const [user, setUser] = useState(null);
        const [userRole, setUserRole] = useState(null);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const checkAuth = async () => {
                try {
                    const { user: authUser } = await getCurrentUser();
                    setUser(authUser);

                    if (authUser) {
                        const role = await determineUserRole(authUser);
                        setUserRole(role);
                    } else {
                        setUserRole(null);
                    }
                } catch (error) {
                    console.error('Auth check error:', error);
                    setUser(null);
                    setUserRole(null);
                } finally {
                    setLoading(false);
                }
            };

            checkAuth();
        }, []);

        const isAdmin = userRole === 'admin';
        const isCustomer = userRole === 'customer';
        const isAuthenticated = !!user;

        const value = {
            user,
            userRole,
            loading,
            isAdmin,
            isCustomer,
            isAuthenticated,
        };

        return (
            <AuthContext.Provider value={value}>
                {children}
            </AuthContext.Provider>
        );
    };
};

export default createAuthProvider;
