import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { Users, Plus, Key, Wallet, ArrowRight, Settings, ExternalLink, ShieldCheck } from 'lucide-react';

const AgencyDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const isEnglish = language === 'en';
    const isRtl = language === 'ar';

    const [clients, setClients] = useState([]);
    const [stats, setStats] = useState({ totalClients: 0, maxClients: 0, walletBalance: 0 });
    const [loading, setLoading] = useState(true);
    
    // Modals state
    const [showAddClient, setShowAddClient] = useState(false);
    const [showTopUp, setShowTopUp] = useState(null); // hold client object

    // Form states
    const [newClient, setNewClient] = useState({ businessName: '', email: '', password: '' });
    const [topUpAmount, setTopUpAmount] = useState(1000);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;
        fetchAgencyData();
    }, [user]);

    const fetchAgencyData = async () => {
        try {
            setLoading(true);
            const [{ data: prof }, { data: pClients }, { data: wallet }] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', user.id).single(),
                supabase.from('profiles').select('id, email, full_name, created_at, entities(business_name, id), wallet_credits(balance)').eq('agency_id', user.id),
                supabase.from('wallet_credits').select('balance').eq('user_id', user.id).maybeSingle()
            ]);

            setStats({
                totalClients: pClients?.length || 0,
                maxClients: prof?.agency_max_clients || 0,
                walletBalance: wallet?.balance || 0
            });

            setClients(pClients || []);
        } catch (err) {
            console.error("Failed to fetch agency data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setError('');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            const res = await fetch('https://dydflepcfdrlslpxapqo.supabase.co/functions/v1/agency-manager', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    action: 'create_sub_account',
                    email: newClient.email,
                    password: newClient.password,
                    businessName: newClient.businessName
                })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            
            setShowAddClient(false);
            setNewClient({ businessName: '', email: '', password: '' });
            fetchAgencyData(); // Refresh list
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleTopUp = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setError('');
        try {
            const { data, error } = await supabase.rpc('transfer_wallet_credits', { 
                p_client_id: showTopUp.id, 
                p_amount: parseInt(topUpAmount) 
            });

            if (error) throw error;
            
            setShowTopUp(null);
            fetchAgencyData(); // Refresh balances
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#09090b', color: 'white' }}>{t('systemStatus.loading')}...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: '#09090b', color: '#f3f4f6', direction: isRtl ? 'rtl' : 'ltr', fontFamily: "'Inter', 'Tajawal', sans-serif" }}>
            {/* Header */}
            <header style={{ background: '#111827', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'white' }}>{isEnglish ? 'Agency Manager' : 'مدير الوكالة'}</h1>
                        <p style={{ color: '#9CA3AF', margin: 0, fontSize: '0.85rem', marginTop: '4px' }}>B2B2B Dashboard</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings size={16} /> {isEnglish ? 'My Account Settings' : 'إعدادات حسابي'}
                    </button>
                </div>
            </header>

            <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Stats Overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(139,92,246,0.3)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ color: '#9CA3AF', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>{isEnglish ? 'Agency Balance' : 'رصيد الوكالة'}</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            {stats.walletBalance.toLocaleString()} <span style={{ fontSize: '1rem', color: '#8B5CF6' }}>{isEnglish ? 'Credits' : 'رصيد'}</span>
                        </div>
                        <Wallet size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', color: 'rgba(139, 92, 246, 0.05)', transform: 'rotate(-15deg)' }} />
                    </div>
                    
                    <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ color: '#9CA3AF', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>{isEnglish ? 'Managed Sub-Accounts' : 'الحسابات الفرعية'}</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>
                            {stats.totalClients} <span style={{ fontSize: '1rem', color: '#6B7280' }}>/ {stats.maxClients === 0 ? '∞' : stats.maxClients}</span>
                        </div>
                        <button onClick={() => setShowAddClient(true)} className="btn btn-primary btn-sm mt-md" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Plus size={16} /> {isEnglish ? 'Create New Sub-Account' : 'إنشاء حساب فرعي جديد'}
                        </button>
                    </div>
                </div>

                {/* Clients Table */}
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={20} color="#8B5CF6"/> {isEnglish ? 'Your Clients' : 'عملائك'}</h2>
                <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#9CA3AF', fontSize: '0.85rem' }}>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{isEnglish ? 'Business Name' : 'اسم المنشأة'}</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{isEnglish ? 'Email' : 'البريد'}</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{isEnglish ? 'Wallet Balance' : 'رصيد المحفظة'}</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'center' }}>{isEnglish ? 'Actions' : 'الإجراءات'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.length === 0 ? (
                                <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>{isEnglish ? 'No clients yet. Create one above!' : 'لا يوجد عملاء حتى الآن. أنشئ حساباً جديداً من الأعلى!'}</td></tr>
                            ) : clients.map(client => (
                                <tr key={client.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
                                        {client.entities?.[0]?.business_name || 'N/A'}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', color: '#9CA3AF', fontSize: '0.9rem' }}>{client.email}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                                            {client.wallet_credits?.[0]?.balance || 0}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                        <button onClick={() => setShowTopUp(client)} className="btn btn-outline btn-sm" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Wallet size={14} /> {isEnglish ? 'Top-up' : 'شحن المحفظة'}
                                        </button>
                                        <button onClick={() => alert('Future Feature: Auto-Login via secure token override!')} className="btn btn-primary btn-sm" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ExternalLink size={14} /> {isEnglish ? 'Manage Dashboard' : 'التحكم كعميل'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Modal: Add Client */}
            {showAddClient && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ background: '#111827', width: '100%', maxWidth: '450px', borderRadius: '20px', padding: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 800 }}>{isEnglish ? 'Provision New Sub-Account' : 'تأسيس حساب فرعي جديد'}</h3>
                        
                        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

                        <form onSubmit={handleCreateClient}>
                            <div className="mb-md">
                                <label className="label">{isEnglish ? 'Business / Salon Name' : 'اسم المنشأة'}</label>
                                <input required type="text" className="input-field" value={newClient.businessName} onChange={e => setNewClient({...newClient, businessName: e.target.value})} />
                            </div>
                            <div className="mb-md">
                                <label className="label">{isEnglish ? 'Email (Login)' : 'البريد الإلكتروني'}</label>
                                <input required type="email" className="input-field" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
                            </div>
                            <div className="mb-xl">
                                <label className="label">{isEnglish ? 'Password' : 'كلمة المرور'}</label>
                                <input required type="password" minLength={6} className="input-field" value={newClient.password} onChange={e => setNewClient({...newClient, password: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddClient(false)}>{isEnglish ? 'Cancel' : 'إلغاء'}</button>
                                <button type="submit" className={`btn btn-primary ${actionLoading ? 'loading' : ''}`} style={{ flex: 1 }} disabled={actionLoading}>{isEnglish ? 'Create' : 'إنشاء'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Top Up */}
            {showTopUp && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ background: '#111827', width: '100%', maxWidth: '400px', borderRadius: '20px', padding: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 800 }}>{isEnglish ? `Top-up Wallet for ${showTopUp.entities?.[0]?.business_name}` : `شحن محفظة ${showTopUp.entities?.[0]?.business_name}`}</h3>
                        
                        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

                        <form onSubmit={handleTopUp}>
                            <div className="mb-xl">
                                <label className="label">{isEnglish ? 'Amount to transfer from your balance' : 'المبلغ المراد سحبه من وكالتك'}</label>
                                <input required type="number" min="1" max={stats.walletBalance} className="input-field" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} />
                                <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '8px' }}>Your current balance: {stats.walletBalance}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowTopUp(null)}>{isEnglish ? 'Cancel' : 'إلغاء'}</button>
                                <button type="submit" className={`btn btn-primary ${actionLoading ? 'loading' : ''}`} style={{ flex: 1 }} disabled={actionLoading}>{isEnglish ? 'Transfer' : 'تحويل'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgencyDashboard;
