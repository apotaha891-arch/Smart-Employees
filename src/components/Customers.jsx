import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Download, Filter } from 'lucide-react';
import { supabase, getCustomers, upsertCustomer } from '../services/supabaseService';
import CustomersTable from './CustomersTable';

const Customers = () => {
    const { t } = useLanguage();
    const { user: contextUser } = useAuth(); // Use AuthContext — respects impersonation
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [entityId, setEntityId] = useState(null);
    const [error, setError] = useState(null);

    // Re-run when impersonated user changes
    useEffect(() => {
        if (contextUser?.id) fetchInitialData();
    }, [contextUser?.id]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            // Use contextUser — correctly reflects impersonated client
            const userId = contextUser?.id;
            if (!userId) { setError(t('mustLogin')); setLoading(false); return; }

            // Get most recent entity config for THIS client only
            const { data: config } = await supabase
                .from('entities')
                .select('id')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (config) {
                setEntityId(config.id);
                const result = await getCustomers(config.id);
                setCustomers(result.data || []);
            } else {
                // No entity for this client — show empty list (NOT all customers!)
                setCustomers([]);
            }
        } catch (err) {
            console.error('Error fetching customers:', err);
            setError(t('failedLoadData'));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCustomer = async (id, updatedData) => {
        try {
            const { success, data, error } = await upsertCustomer({ id, ...updatedData });
            if (!success) throw new Error(error);

            setCustomers(customers.map(c => c.id === id ? data : c));
        } catch (err) {
            console.error('Error updating customer:', err);
            alert(t('failedUpdateCustomer'));
        }
    };

    const handleDeleteCustomer = async (id) => {
        if (!window.confirm(t('confirmDeleteCustomer'))) return;

        try {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setCustomers(customers.filter(c => c.id !== id));
        } catch (err) {
            console.error('Error deleting customer:', err);
            alert(t('failedDeleteRecord'));
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
                {t('loading')}
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
                {error}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '48px', height: '48px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#8B5CF6'
                    }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <h1 style={{ color: 'var(--color-text-main)', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{t('customersTitle')}</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>{t('customersSubtitle')}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button style={{
                        background: 'var(--color-bg-input)', color: 'var(--color-text-main)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: '8px', padding: '10px 16px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        cursor: 'pointer', fontSize: '0.9rem'
                    }}>
                        <Download size={18} />
                        {t('exportData')}
                    </button>
                    <button style={{
                        background: '#8B5CF6', color: 'var(--color-text-main)', border: 'none',
                        borderRadius: '8px', padding: '10px 20px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                    }}>
                        <Plus size={18} />
                        {t('addCustomer')}
                    </button>
                </div>
            </div>

            {/* Stats Summary (Optional) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div style={{ background: 'var(--color-bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border-subtle)' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>{t('totalCustomers')}</div>
                    <div style={{ color: 'var(--color-text-main)', fontSize: '1.8rem', fontWeight: 700 }}>{customers.length}</div>
                </div>
                <div style={{ background: 'var(--color-bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border-subtle)' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>{t('activeWhatsapp')}</div>
                    <div style={{ color: '#10B981', fontSize: '1.8rem', fontWeight: 700 }}>{customers.filter(c => c.customer_phone).length}</div>
                </div>
                <div style={{ background: 'var(--color-bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border-subtle)' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>{t('activeInstagram')}</div>
                    <div style={{ color: '#EC4899', fontSize: '1.8rem', fontWeight: 700 }}>{customers.filter(c => c.instagram_id).length}</div>
                </div>
            </div>

            {/* Customers Table Section */}
            <CustomersTable
                customers={customers}
                onUpdateCustomer={handleUpdateCustomer}
                onDeleteCustomer={handleDeleteCustomer}
            />
        </div>
    );
};

export default Customers;
