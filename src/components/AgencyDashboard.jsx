import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { Users, Plus, Key, Wallet, ArrowRight, Settings, ExternalLink, ShieldCheck, LayoutDashboard } from 'lucide-react';

const AgencyDashboard = () => {
    const { user, realUser, impersonateUser, isImpersonating } = useAuth();
    // Always use the REAL agency user ID for data fetching, never the impersonated client
    const agencyUserId = realUser?.id || user?.id;
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
    const [newClient, setNewClient] = useState({ businessName: '', email: '', password: '', businessType: 'general', phone: '' });
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
            setError('');
            
            const currentUserId = agencyUserId; // Always the real agency, not impersonated
            if (!currentUserId) return;

            // 1. Fetch agency profile (basic info for stats)
            const { data: prof } = await supabase
                .from('profiles')
                .select('agency_max_clients, is_agency')
                .eq('id', currentUserId)
                .maybeSingle();

            if (prof && !prof.is_agency) {
                console.warn("Note: is_agency is false in profiles - but continuing to fetch clients via RPC");
            }

            // 2. Use RPC to bypass RLS entirely (like AdminDashboard does)
            const { data: clientsData, error: rpcError } = await supabase
                .rpc('get_agency_clients', { p_agency_id: currentUserId });

            if (rpcError) {
                console.error("RPC Error:", rpcError.message);
                // Fallback: direct query 
                const { data: fallbackClients } = await supabase
                    .from('profiles')
                    .select('id, email, full_name, phone, business_name, business_type, created_at')
                    .eq('agency_id', currentUserId);
                
                const enriched = await Promise.all((fallbackClients || []).map(async (c) => {
                    const [eRes, wRes] = await Promise.all([
                        supabase.from('entities').select('id, business_name').eq('user_id', c.id).maybeSingle(),
                        supabase.from('wallet_credits').select('balance').eq('user_id', c.id).maybeSingle()
                    ]);
                    return { ...c, entity_id: eRes.data?.id, entity_business_name: eRes.data?.business_name || c.business_name, wallet_balance: wRes.data?.balance || 0 };
                }));
                setClients(enriched || []);
                setStats({ totalClients: enriched?.length || 0, maxClients: prof?.agency_max_clients || 100, walletBalance: 0 });
                return;
            }

            // 3. Fetch agency own wallet
            const { data: wallet } = await supabase
                .from('wallet_credits')
                .select('balance')
                .eq('user_id', currentUserId)
                .maybeSingle();

            setClients(clientsData || []);
            setStats({
                totalClients: clientsData?.length || 0,
                maxClients: prof?.agency_max_clients || 100,
                walletBalance: wallet?.balance || 0
            });

        } catch (err) {
            console.error("fetchAgencyData Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setError('');
        try {
            const { data, error: functionError } = await supabase.functions.invoke('agency-manager', {
                body: {
                    action: 'create_sub_account',
                    email: newClient.email,
                    password: newClient.password,
                    businessName: newClient.businessName,
                    businessType: newClient.businessType,
                    phone: newClient.phone
                }
            });

            if (functionError) {
                console.error("DIAGNOSTIC - Function Invoke Error:", functionError);
                let actualErrorMessage = functionError.message;
                
                if (functionError.context) {
                    try {
                        // Clone the response so we can read it safely without locking the stream
                        const clonedContext = functionError.context.clone();
                        const ctxText = await clonedContext.json();
                        actualErrorMessage = ctxText.error || ctxText.message || functionError.message;
                    } catch (e) {
                         // Ignore JSON parse errors
                    }
                }
                throw new Error(actualErrorMessage);
            }
            if (data?.error) {
                console.error("DIAGNOSTIC - Data Error from Function:", data.error);
                throw new Error(data.error);
            }
            
            setShowAddClient(false);
            setNewClient({ businessName: '', email: '', password: '' });
            fetchAgencyData(); // Refresh list
        } catch (err) {
            console.error("DIAGNOSTIC - Create Client Catch Block:", err);
            setError(err.message || 'An error occurred while creating the client.');
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
                        <p style={{ color: '#9CA3AF', margin: 0, fontSize: '0.75rem', marginTop: '4px' }}>
                            B2B2B Dashboard &nbsp;|&nbsp;
                            <span style={{ color: '#8B5CF6', fontFamily: 'monospace' }}>
                                ID: {user?.id?.substring(0, 8)}...
                            </span>
                            {error && <span style={{ color: '#EF4444', marginRight: '8px' }}>⚠️ {isEnglish ? 'Check Account' : 'تحقق من الحساب'}</span>}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderColor: 'rgba(255,255,255,0.1)' }}>
                        <LayoutDashboard size={16} /> {isEnglish ? 'My Business View' : 'عرض منشأتي الخاصة'}
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
                                        {/* Support both RPC flat format and old nested format */}
                                        {client.entity_business_name || client.entities?.[0]?.business_name || client.business_name || 'N/A'}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', color: '#9CA3AF', fontSize: '0.9rem' }}>{client.email}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                                            {/* Support both RPC flat format and old nested format */}
                                            {client.wallet_balance ?? client.wallet_credits?.[0]?.balance ?? 0}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                        <button onClick={() => setShowTopUp(client)} className="btn btn-outline btn-sm" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Wallet size={14} /> {isEnglish ? 'Top-up' : 'شحن المحفظة'}
                                        </button>
                                        <button 
                                            onClick={() => {
                                                impersonateUser({
                                                    id: client.id,
                                                    email: client.email,
                                                    full_name: client.full_name,
                                                    is_impersonated: true
                                                });
                                                navigate('/dashboard');
                                            }} 
                                            className="btn btn-primary btn-sm" 
                                            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
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
                                <input required type="text" className="input-field" value={newClient.businessName} onChange={e => setNewClient({...newClient, businessName: e.target.value})} placeholder="e.g. My Awesome Salon" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label className="label">{isEnglish ? 'Sector' : 'نوع النشاط'}</label>
                                    <select className="input-field" value={newClient.businessType} onChange={e => setNewClient({...newClient, businessType: e.target.value})}>
                                        <option value="general">{isEnglish ? 'General' : 'نشاط عام'}</option>
                                        <option value="salon">{isEnglish ? 'Beauty & Salon' : 'صالون وجمال'}</option>
                                        <option value="dental">{isEnglish ? 'Medical/Dental' : 'مركز طبي/أسنان'}</option>
                                        <option value="law_firm">{isEnglish ? 'Law Firm' : 'مكتب محاماة'}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">{isEnglish ? 'Phone' : 'رقم الهاتف'}</label>
                                    <input required type="tel" className="input-field" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} placeholder="966..." />
                                </div>
                            </div>
                            <div className="mb-md">
                                <label className="label">{isEnglish ? 'Email (Login)' : 'البريد الإلكتروني للعميل'}</label>
                                <input required type="email" className="input-field" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} placeholder="client@example.com" />
                            </div>
                            <div className="mb-xl">
                                <label className="label">{isEnglish ? 'Password' : 'كلمة المرور'}</label>
                                <input required type="password" minLength={6} className="input-field" value={newClient.password} onChange={e => setNewClient({...newClient, password: e.target.value})} placeholder="••••••••" />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddClient(false)}>{isEnglish ? 'Cancel' : 'إلغاء'}</button>
                                <button type="submit" className={`btn btn-primary ${actionLoading ? 'loading' : ''}`} style={{ flex: 1 }} disabled={actionLoading}>{isEnglish ? 'Create & Setup' : 'إنشاء وجدولة'}</button>
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
