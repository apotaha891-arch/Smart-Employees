import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { useAuth } from './AuthContext';

const BrandingContext = createContext();

export const BrandingProvider = ({ children }) => {
    const { user } = useAuth();
    const [branding, setBranding] = useState({
        is_custom: false,
        brand_name: '24Shift',
        logo_url: '/logo.png',
        primary_color: '#8B5CF6',
        hide_credits: false,
        loading: true
    });

    const fetchBranding = async () => {
        try {
            const domain = window.location.hostname;
            const isLocal = domain === 'localhost' || domain.includes('127.0.0.1');
            
            // Wait slightly if user is just logging in to ensure session is ready
            // Add a safety timeout for the RPC call
            const fetchPromise = supabase.rpc('get_branding_config', {
                p_domain: isLocal ? '' : domain
            });
            
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Branding fetch timeout')), 5000)
            );

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

            if (error) throw error;

            if (data) {
                setBranding({ ...data, loading: false });
                
                // Set CSS variable for primary color
                if (data.primary_color) {
                    document.documentElement.style.setProperty('--primary-brand-color', data.primary_color);
                }
            }
        } catch (err) {
            console.error('Branding load error:', err);
            setBranding(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        fetchBranding();
    }, [user?.id]); // Re-fetch when user logs in or switches (impersonation)

    return (
        <BrandingContext.Provider value={branding}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = () => {
    const context = useContext(BrandingContext);
    if (!context) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
};
