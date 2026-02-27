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

    // 1. app_metadata — most reliable, stored in JWT
    if (authUser.app_metadata?.role) return authUser.app_metadata.role;

    // 2. user_metadata
    if (authUser.user_metadata?.role) return authUser.user_metadata.role;

    // 3. profiles table with a short timeout to avoid hanging
    try {
        const { data } = await Promise.race([
            supabase.from('profiles').select('role').eq('id', authUser.id).maybeSingle(),
            new Promise(resolve => setTimeout(() => resolve({ data: null }), 3000))
        ]);
        if (data?.role) return data.role;
    } catch { /* ignore */ }

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
                    setUser(authUser);
                    const role = await getRoleFromUser(authUser);
                    if (!cancelled) {
                        setUserRole(role);
                        setLoading(false); // ← always unblock here
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
