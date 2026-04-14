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
const getAuthDetails = async (authUser) => {
    if (!authUser) return { role: null, isAgency: false };

    // Fast-path: JWT app_metadata has is_agency=true explicitly
    // (only trust this when it's explicitly true, not just because role is set)
    if (authUser.app_metadata?.is_agency === true) {
        return { 
            role: authUser.app_metadata.role || 'customer', 
            isAgency: true 
        };
    }

    // PRIMARY SOURCE: Always verify is_agency from the database
    // This is the authoritative source and cannot be fooled by stale JWT metadata
    try {
        const { data } = await supabase
            .from('profiles')
            .select('role, is_agency')
            .eq('id', authUser.id)
            .maybeSingle();
        
        if (data) {
            return { 
                role: data.role || 'customer', 
                isAgency: !!data.is_agency 
            };
        }
    } catch (e) {
        console.warn("Auth DB check failed, using JWT fallback:", e.message);
    }

    // Last fallback: user_metadata
    if (authUser.user_metadata?.is_agency === true) {
        return { role: 'customer', isAgency: true };
    }

    return { role: 'customer', isAgency: false };
};

export const createAuthProvider = () => {
    return function AuthProvider({ children }) {
        console.log('🛡️ AuthProvider Mounting...');
        const [user, setUser] = useState(null);
        const [userRole, setUserRole] = useState(null);
        const [isAgency, setIsAgency] = useState(false);
        const [loading, setLoading] = useState(true);
        
        // Impersonation state
        const [impersonatedUser, setImpersonatedUser] = useState(() => {
            const saved = sessionStorage.getItem('impersonated_user');
            if (saved) console.log('👤 Found impersonated user in session storage');
            return saved ? JSON.parse(saved) : null;
        });

        useEffect(() => {
            let cancelled = false;

            const initializeAuth = async (session) => {
                const authUser = session?.user ?? null;
                console.log('🔐 Auth Initializing. User:', authUser?.email || 'Guest');
                if (cancelled) return;

                setUser(authUser);
                
                if (authUser) {
                    console.log('🔍 Fetching Auth Details for:', authUser.id);
                    const { role, isAgency } = await getAuthDetails(authUser);
                    if (!cancelled) {
                        console.log('✅ Auth Details:', { role, isAgency });
                        setUserRole(role);
                        setIsAgency(isAgency);
                        setLoading(false);
                    }
                } else {
                    console.log('👋 No active session. Cleared user state.');
                    setUserRole(null);
                    setIsAgency(false);
                    setLoading(false);
                }
            };

            // Get initial session
            console.log('⏳ Fetching initial session...');
            supabase.auth.getSession().then(({ data: { session } }) => {
                console.log('📡 Initial session response received');
                initializeAuth(session);
            });

            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (event, session) => {
                    console.log('🔄 Auth State Changed Event:', event);
                    initializeAuth(session);
                }
            );

            const fallback = setTimeout(() => {
                if (!cancelled && loading) {
                    console.warn('⚠️ Auth check timed out after 5s. Forcing loading to false.');
                    setLoading(false);
                }
            }, 5000);

            return () => {
                cancelled = true;
                subscription.unsubscribe();
                clearTimeout(fallback);
            };
        }, []);


        const impersonateUser = (targetUser) => {
            setImpersonatedUser(targetUser);
            sessionStorage.setItem('impersonated_user', JSON.stringify(targetUser));
        };

        const stopImpersonating = () => {
            setImpersonatedUser(null);
            sessionStorage.removeItem('impersonated_user');
        };

        // The effective user and roles
        const activeUser = impersonatedUser || user;
        const effectiveRole = impersonatedUser ? 'customer' : userRole;

        return (
            <AuthContext.Provider value={{
                user: activeUser,         // Impersonated client OR real agency
                realUser: user,           // Always the real logged-in agency
                userRole: effectiveRole,  // Effective role: 'customer' during support
                realUserRole: userRole,   // The real admin/agency role
                loading,
                isAdmin: effectiveRole === 'admin',
                realIsAdmin: userRole === 'admin',
                isCustomer: effectiveRole === 'customer',
                // When impersonating: isAgency = false (treat as regular customer)
                isAgency: impersonatedUser ? false : isAgency,
                realIsAgency: isAgency,   // The real agency status, always
                isAuthenticated: !!user,
                isImpersonating: !!impersonatedUser,
                impersonateUser,
                stopImpersonating
            }}>
                {children}
            </AuthContext.Provider>
        );
    };
};

export default createAuthProvider;
