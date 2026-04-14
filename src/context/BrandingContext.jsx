import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { useAuth } from './AuthContext';

const BrandingContext = createContext();

export const BrandingProvider = ({ children }) => {
    console.log('🎨 BrandingProvider Mounting...');
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
            console.log('📡 Fetching branding for domain:', domain, 'User ID:', user?.id);
            const isLocal = domain === 'localhost' || domain.includes('127.0.0.1');
            
            const fetchPromise = supabase.rpc('get_branding_config', {
                p_domain: isLocal ? '' : domain
            });
            
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Branding fetch timeout')), 5000)
            );

            console.log('⏳ Waiting for branding RPC data...');
            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

            if (error) {
                console.error('❌ Branding RPC Error:', error);
                throw error;
            }

            if (data) {
                console.log('✅ Branding Data Received:', data);
                setBranding({ ...data, loading: false });
                
                if (data.primary_color) {
                    console.log('🎨 Setting Primary Brand Color:', data.primary_color);
                    document.documentElement.style.setProperty('--primary-brand-color', data.primary_color);
                }
            } else {
                console.log('ℹ️ No custom branding found, using defaults.');
                setBranding(prev => ({ ...prev, loading: false }));
            }
        } catch (err) {
            console.error('⚠️ Branding load error:', err);
            setBranding(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        fetchBranding();
    }, [user?.id]);

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
