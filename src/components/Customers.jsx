import React, { useState, useEffect } from 'react';
import { Users, Plus, Download, Filter } from 'lucide-react';
import { supabase, getCustomers, upsertCustomer } from '../services/supabaseService';
import CustomersTable from './CustomersTable';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [salonConfigId, setSalonConfigId] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setError('يجب تسجيل الدخول أولاً');
                setLoading(false);
                return;
            }

            // Get the first active salon config for this user
            const { data: config, error: configError } = await supabase
                .from('salon_configs')
                .select('id')
                .eq('user_id', user.id)
                .is('is_active', true)
                .maybeSingle();

            if (configError) throw configError;

            if (config) {
                setSalonConfigId(config.id);
                const { data: customersData, error: customersError } = await getCustomers(config.id);
                if (customersError) throw customersError;
                setCustomers(customersData || []);
            } else {
                setError('يرجى إكمال إعداد المنشأة أولاً');
            }
        } catch (err) {
            console.error('Error fetching customers:', err);
            setError('فشل في تحميل البيانات');
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
            alert('فشل في تحديث بيانات الزبونة');
        }
    };

    const handleDeleteCustomer = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف سجل هذه الزبونة؟')) return;

        try {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setCustomers(customers.filter(c => c.id !== id));
        } catch (err) {
            console.error('Error deleting customer:', err);
            alert('فشل في حذف السجل');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#9CA3AF' }}>
                جاري التحميل...
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
                        <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>نظام الهوية الموحدة</h1>
                        <p style={{ color: '#9CA3AF', fontSize: '0.9rem', margin: '4px 0 0 0' }}>إدارة سجلات الزبائن وتوحيد الهويات عبر المنصات</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button style={{
                        background: '#1F2937', color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px', padding: '10px 16px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        cursor: 'pointer', fontSize: '0.9rem'
                    }}>
                        <Download size={18} />
                        تصدير البيانات
                    </button>
                    <button style={{
                        background: '#8B5CF6', color: 'white', border: 'none',
                        borderRadius: '8px', padding: '10px 20px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                    }}>
                        <Plus size={18} />
                        إضافة زبونة
                    </button>
                </div>
            </div>

            {/* Stats Summary (Optional) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '8px' }}>إجمالي الزبائن</div>
                    <div style={{ color: 'white', fontSize: '1.8rem', fontWeight: 700 }}>{customers.length}</div>
                </div>
                <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '8px' }}>نشط عبر واتساب</div>
                    <div style={{ color: '#10B981', fontSize: '1.8rem', fontWeight: 700 }}>{customers.filter(c => c.customer_phone).length}</div>
                </div>
                <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '8px' }}>نشط عبر إنستقرام</div>
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
