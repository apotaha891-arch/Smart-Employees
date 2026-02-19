import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, getProfile } from '../services/supabaseService';

// Create Auth Context
const AuthContext = createContext();

/**
 * Factory function to create AuthProvider component
 * Wraps app with authentication state and role detection
 */
export const createAuthProvider = () => {
    return function AuthProvider({ children }) {
        const [user, setUser] = useState(null);
        const [userRole, setUserRole] = useState('customer');
        const [loading, setLoading] = useState(true);
        const [isAuthenticated, setIsAuthenticated] = useState(false);

        // List of admin email addresses (can also check database role)
        const adminEmails = ['admin@example.com', 'admin@agentic.com'];

        /**
         * Determine user role based on email or database role column
         */
        const determineUserRole = async (authUser) => {
            if (!authUser) {
                setUserRole('customer');
                return 'customer';
            }

            // Check if email is in admin list (priority 1)
            if (adminEmails.includes(authUser.email)) {
                setUserRole('admin');
                return 'admin';
            }

            // Check database for role (priority 2)
            try {
                const profileResult = await getProfile(authUser.id);
                if (profileResult.success && profileResult.data?.role) {
                    const role = profileResult.data.role;
                    setUserRole(role);
                    return role;
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }

            // Default to customer
            setUserRole('customer');
            return 'customer';
        };

        /**
         * Initialize authentication on mount
         */
        useEffect(() => {
            const initAuth = async () => {
                try {
                    setLoading(true);
                    const { user: authUser } = await getCurrentUser();
                    
                    if (authUser) {
                        setUser(authUser);
                        setIsAuthenticated(true);
                        await determineUserRole(authUser);
                    } else {
                        setUser(null);
                        setIsAuthenticated(false);
                        setUserRole('customer');
                    }
                } catch (error) {
                    console.error('Auth initialization error:', error);
                    setUser(null);
                    setIsAuthenticated(false);
                    setUserRole('customer');
                } finally {
                    setLoading(false);
                }
            };

            initAuth();
        }, []);

        const value = {
            user,
            userRole,
            loading,
            isAuthenticated,
            isAdmin: userRole === 'admin',
            isCustomer: userRole === 'customer',
            determineUserRole,
        };

        return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
    };
};

/**
 * Hook to use Auth Context
 * Usage: const { user, userRole, isAdmin } = useAuth();
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

// Create default provider instance
export const AuthProvider = createAuthProvider();
