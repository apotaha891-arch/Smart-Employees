import { useState, useEffect, useContext, createContext } from 'react';
import { supabase } from '../services/supabaseService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

// Read role from app_metadata (set in auth.users via SQL — never blocked by RLS)
// Falls back to profiles table, then defaults to 'customer'
const getRoleFromUser = async (authUser) => {
    if (!authUser) return null;

    // 1. JWT app_metadata (set via admin actions/SQL directly)
    if (authUser.app_metadata?.role) return authUser.app_metadata.role;

    // 2. JWT user_metadata
    if (authUser.user_metadata?.role) return authUser.user_metadata.role;

    // 3. Profiles table with short retries (to allow trigger to fire)
    let attempts = 0;
    while (attempts < 3) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', authUser.id)
                .maybeSingle();
            if (data?.role) return data.role;
            if (error) throw error;
        } catch { /* wait & retry */ }
        attempts++;
        await new Promise(r => setTimeout(r, 500 * attempts));
    }

    return 'customer';
};

export const createAuthProvider = () => {
    return function AuthProvider({ children }) {
        const [user, setUser] = useState(null);
        const [userRole, setUserRole] = useState(null);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            let cancelled = false;

            // onAuthStateChange fires immediately with INITIAL_SESSION
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (_event, session) => {
                    const authUser = session?.user ?? null;
                    if (cancelled) return;

                    // Prevent redundant state updates if user ID is the same
                    setUser(prev => {
                        if (prev?.id === authUser?.id) return prev;
                        return authUser;
                    });
                    
                    const role = await getRoleFromUser(authUser);
                    if (!cancelled) {
                        setUserRole(role);
                        setLoading(false);
                    }
                }
            );

            // Safety net: if onAuthStateChange never fires, unblock after 5s
            const fallback = setTimeout(() => {
                if (!cancelled) setLoading(false);
            }, 5000);

            return () => {
                cancelled = true;
                subscription.unsubscribe();
                clearTimeout(fallback);
            };
        }, []);

        return (
            <AuthContext.Provider value={{
                user,
                userRole,
                loading,
                isAdmin: userRole === 'admin',
                isCustomer: userRole === 'customer',
                isAuthenticated: !!user,
            }}>
                {children}
            </AuthContext.Provider>
        );
    };
};

export default createAuthProvider;
