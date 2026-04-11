import React, { useState, useEffect } from 'react';
import { supabase, uploadAgencyLogo } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { Users, Plus, Key, Wallet, ArrowRight, Settings, ExternalLink, ShieldCheck, LayoutDashboard, Palette, ImagePlus, Globe, UploadCloud, CheckCircle2, Zap } from 'lucide-react';

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
    const [agencyName, setAgencyName] = useState('');
    const [brandingConfig, setBrandingConfig] = useState({
        brand_name: '',
        logo_url: '',
        primary_color: '#8B5CF6',
        hide_credits: false,
        custom_domain: ''
    });
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [showLegalModal, setShowLegalModal] = useState(false);
    const [showDomainHelp, setShowDomainHelp] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isWhiteLabelPaid, setIsWhiteLabelPaid] = useState(false);
    const [brandingRequest, setBrandingRequest] = useState(null);
    const [requestLoading, setRequestLoading] = useState(false);

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
                .select('agency_max_clients, is_agency, business_name, white_label_config, is_white_label_paid')
                .eq('id', currentUserId)
                .maybeSingle();
            
            if (prof) {
                setAgencyName(prof.business_name || '');
                setIsWhiteLabelPaid(!!prof.is_white_label_paid);
                setAgreedToTerms(!!prof.is_white_label_paid);
            }

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

            // 5. Fetch branding request status
            if (prof?.is_white_label_paid) {
                const { data: req } = await supabase
                    .from('white_label_requests')
                    .select('*')
                    .eq('user_id', currentUserId)
                    .maybeSingle();
                setBrandingRequest(req);
                if (req && req.status !== 'approved') {
                    // Pre-fill form with request data if it exists
                    setBrandingConfig({
                        brand_name: req.brand_name || '',
                        logo_url: req.logo_url || '',
                        primary_color: req.primary_color || '#8B5CF6',
                        custom_domain: req.custom_domain || '',
                        hide_credits: true
                    });
                }
            }

        } catch (err) {
            console.error("fetchAgencyData Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        setError('');
        const result = await uploadAgencyLogo(agencyUserId, file);
        if (result.success) {
            setBrandingConfig(prev => ({ ...prev, logo_url: result.url }));
        } else {
            setError(result.error);
        }
        setUploadingLogo(false);
    };

    const handleWhiteLabelPayment = async () => {
        setActionLoading(true);
        setError('');
        try {
            const { data, error: functionError } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    planId: 'agency_white_label',
                    successUrl: `${window.location.origin}/agency?paid=success`,
                    cancelUrl: `${window.location.origin}/agency?paid=cancel`
                }
            });

            // 1. Handle actual function call failures
            if (functionError) {
                // Check if there is an error message inside the body
                const body = await functionError.context?.json().catch(() => null);
                throw new Error(body?.error || functionError.message || (isEnglish ? 'Payment service error' : 'خطأ في خدمة الدفع'));
            }

            // 2. Handle business logic errors returned normally
            if (data?.error) {
                throw new Error(data.error);
            }

            // 3. Success: Redirect to Stripe
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error(isEnglish ? 'Could not prepare checkout URL' : 'فشل تجهيز رابط الدفع');
            }
        } catch (err) {
            console.error("Detailed Payment Error:", err);
            setError(err.message);
        } finally {
            setActionLoading(false);
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

    const handleUpdateAgencyProfile = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setError('');
        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ business_name: agencyName })
                .eq('id', agencyUserId);

            if (updateError) throw updateError;
            alert(isEnglish ? 'Agency profile updated!' : 'تم تحديث ملف الوكالة بنجاح!');
            fetchAgencyData();
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveBranding = async (e) => {
        e.preventDefault();
        if (!brandingConfig.brand_name) return setError(isEnglish ? 'Brand name is required' : 'اسم العلامة التجارية مطلوب');
        
        setRequestLoading(true);
        setError('');
        try {
            const { error: reqError } = await supabase
                .from('white_label_requests')
                .upsert({ 
                    user_id: agencyUserId,
                    brand_name: brandingConfig.brand_name,
                    logo_url: brandingConfig.logo_url,
                    primary_color: brandingConfig.primary_color,
                    custom_domain: brandingConfig.custom_domain,
                    status: 'pending',
                    updated_at: new Date()
                }, { onConflict: 'user_id' });

            if (reqError) throw reqError;
            alert(isEnglish ? 'Branding request submitted for review!' : 'تم إرسال طلب الهوية للمراجعة بنجاح!');
            fetchAgencyData();
        } catch (err) {
            setError(err.message);
        } finally {
            setRequestLoading(false);
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
                        <button onClick={() => { setError(''); setShowAddClient(true); }} className="btn btn-primary btn-sm mt-md" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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
                                <tr><td colSpan="3" style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>{isEnglish ? 'No clients yet. Create one above!' : 'لا يوجد عملاء حتى الآن. أنشئ حساباً جديداً من الأعلى!'}</td></tr>
                            ) : clients.map(client => (
                                <tr key={client.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 800, color: 'white' }}>
                                            {client.entity_business_name || client.entities?.[0]?.business_name || client.business_name || (client.full_name || client.email)}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{client.email}</div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                                            {/* Support both RPC flat format and old nested format */}
                                            {client.wallet_balance ?? client.wallet_credits?.[0]?.balance ?? 0}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                        <button onClick={() => { setError(''); setShowTopUp(client); }} className="btn btn-outline btn-sm" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
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

                {/* Branding Settings Section */}
                <div style={{ marginTop: '3rem', background: '#111827', borderRadius: '24px', padding: '2rem', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Palette size={24} color="#8B5CF6" />
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{isEnglish ? 'White-Label Request Form' : 'نموذج طلب الهوية الخاصة'}</h2>
                        </div>
                        {isWhiteLabelPaid && brandingRequest && (
                            <div style={{ 
                                padding: '6px 16px', 
                                borderRadius: '20px', 
                                fontSize: '0.85rem', 
                                fontWeight: 700,
                                background: brandingRequest.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : brandingRequest.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                color: brandingRequest.status === 'approved' ? '#10B981' : brandingRequest.status === 'rejected' ? '#EF4444' : '#F59E0B',
                                border: '1px solid currentColor'
                            }}>
                                {brandingRequest.status === 'approved' ? (isEnglish ? '✓ Approved & Live' : '✓ معتمد ونشط') : 
                                 brandingRequest.status === 'rejected' ? (isEnglish ? '✕ Rejected' : '✕ تم الرفض') : 
                                 (isEnglish ? '⏳ Under Review' : '⏳ قيد المراجعة')}
                            </div>
                        )}
                    </div>

                    {!isWhiteLabelPaid ? (
                        /* Stage 3 Upgrade Wall */
                        <div style={{ 
                            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)', 
                            padding: '3rem 2rem', 
                            borderRadius: '20px', 
                            border: '1px solid rgba(236, 72, 153, 0.3)', 
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1.5rem'
                        }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EC4899' }}>
                                <Zap size={40} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem' }}>{t('upgrade.unlockWhiteLabelTitle')}</h3>
                                <p style={{ color: '#9CA3AF', maxWidth: '600px', lineHeight: 1.6 }}>{t('upgrade.unlockWhiteLabelDesc')}</p>
                            </div>
                            <button 
                                onClick={handleWhiteLabelPayment} 
                                disabled={actionLoading}
                                className="btn btn-primary" 
                                style={{ padding: '1rem 3rem', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800, background: 'linear-gradient(to right, #EC4899, #8B5CF6)', border: 'none' }}
                            >
                                {actionLoading ? <div className="loading-spinner-sm"></div> : t('upgrade.unlockWhiteLabelBtn')}
                            </button>
                        </div>
                    ) : (
                        /* Branding Form (Visible if paid) */
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                            {/* Configuration Form */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {brandingRequest?.status === 'rejected' && brandingRequest.admin_notes && (
                                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: '12px', color: '#EF4444', fontSize: '0.9rem' }}>
                                        <strong>{isEnglish ? 'Admin Feedback:' : 'ملاحظات الإدارة:'}</strong> {brandingRequest.admin_notes}
                                    </div>
                                )}
                                
                                 <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '1.25rem', borderRadius: '16px', color: '#A78BFA', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                                    <strong>💡 {isEnglish ? 'Separate Instance Model:' : 'نظام النسخة المستقلة:'}</strong><br/>
                                    {isEnglish 
                                        ? 'These settings are for your custom white-label instance. Changing them will not affect the main 24Shift dashboard, as your brand will live on its own separate domain/copy once approved.' 
                                        : 'هذه الإعدادات مخصصة لنسختك المستقلة تماماً. تعديلها لن يؤثر على منصة 24شفت الرئيسية، حيث ستعمل علامتك التجارية على نطاق (Domain) ونظام مستقل خاص بك فور الاعتماد.'}
                                </div>

                                {/* 1. Agency Core Profile */}
                                <fieldset disabled={brandingRequest?.status === 'pending'} style={{ border: 'none', padding: 0, margin: 0 }}>
                            <form onSubmit={handleUpdateAgencyProfile} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#8B5CF6', marginBottom: '1rem', textTransform: 'uppercase' }}>
                                    {isEnglish ? 'Agency Internal Profile' : 'الملف الشخصي للوكالة'}
                                </div>
                                <div className="mb-md">
                                    <label className="label">{isEnglish ? 'Agency Official Name' : 'اسم الوكالة الرسمي'}</label>
                                    <input type="text" className="input-field" value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="e.g. Solana AI" />
                                    <p style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '4px' }}>
                                        {isEnglish ? 'This is how you appear in logs and internal dashboard.' : 'هذا هو الاسم الذي يظهر لك في النظام الداخلي والتقارير.'}
                                    </p>
                                </div>
                                <button type="submit" className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                                    {isEnglish ? 'Update Name' : 'تحديث الاسم الرسمي'}
                                </button>
                            </form>

                            {/* 2. Platform Branding (The White Label) */}
                            <form onSubmit={handleSaveBranding} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#EC4899', marginBottom: '1rem', textTransform: 'uppercase' }}>
                                    {isEnglish ? 'Public Platform Identity' : 'هوية المنصة العامة (White Label)'}
                                </div>
                                <div className="mb-md">
                                    <label className="label">{isEnglish ? 'Platform Brand Name' : 'اسم العلامة التجارية للمنصة'}</label>
                                    <input type="text" className="input-field" value={brandingConfig.brand_name} onChange={e => setBrandingConfig({...brandingConfig, brand_name: e.target.value})} placeholder="Replaces '24Shift' for clients" />
                                    <p style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '4px' }}>
                                        {isEnglish ? 'This name will replace "24Shift" for ALL your clients.' : 'هذا الاسم سيحل محل "24Shift" عند جميع عملائك.'}
                                    </p>
                                </div>
                                <div className="mb-md">
                                    <label className="label">{isEnglish ? 'Logo & Branding' : 'الشعار والهوية'}</label>
                                    <p style={{ fontSize: '0.65rem', color: '#A78BFA', marginBottom: '8px', lineHeight: '1.4' }}>
                                        💡 {isEnglish ? 'Use 4:1 ratio (300x80px) for header, 1:1 for sidebar.' : 'استخدم نسبة 4:1 (300x80 بكسل) للهيدر، و 1:1 للقائمة الجانبية.'}
                                    </p>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div 
                                            onClick={() => document.getElementById('logo-upload').click()}
                                            style={{ 
                                                width: '64px', 
                                                height: '64px', 
                                                borderRadius: '12px', 
                                                background: 'rgba(255,255,255,0.05)', 
                                                border: '1px dashed rgba(255,255,255,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {uploadingLogo ? <UploadCloud className="animate-pulse" size={24} /> : (
                                                brandingConfig.logo_url ? <img src={brandingConfig.logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImagePlus size={24} color="#6B7280" />
                                            )}
                                            <input id="logo-upload" type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <input 
                                                type="text" 
                                                className="input-field" 
                                                value={brandingConfig.logo_url} 
                                                onChange={e => setBrandingConfig({...brandingConfig, logo_url: e.target.value})} 
                                                placeholder={isEnglish ? "Or paste URL manually..." : "أو ضع الرابط يدوياً..."} 
                                                style={{ fontSize: '0.8rem' }}
                                            />
                                            {brandingConfig.logo_url && !uploadingLogo && <div style={{ fontSize: '0.65rem', color: '#10B981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12}/> {isEnglish ? 'Ready' : 'جاهز'}</div>}
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-md">
                                    <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Globe size={16}/> {isEnglish ? 'Custom Domain' : 'النطاق الخاص (Domain)'}</div>
                                        <button 
                                            type="button" 
                                            onClick={() => setShowDomainHelp(true)}
                                            style={{ background: 'rgba(139,92,246,0.1)', border: 'none', color: '#8B5CF6', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            ?
                                        </button>
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input 
                                            type="text" 
                                            className="input-field" 
                                            value={brandingConfig.custom_domain} 
                                            onChange={e => setBrandingConfig({...brandingConfig, custom_domain: e.target.value})} 
                                            placeholder="e.g. app.youragency.com" 
                                            style={{ flex: 1 }}
                                        />
                                        {brandingConfig.custom_domain && (
                                            <a 
                                                href={`http://${brandingConfig.custom_domain}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="btn btn-outline btn-sm"
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', padding: '0 12px', height: '42px' }}
                                            >
                                                <ExternalLink size={14} /> {isEnglish ? 'Test' : 'اختبار'}
                                            </a>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.65rem', color: '#6B7280', marginTop: '4px' }}>
                                        {isEnglish ? 'Requires CNAME record pointing to our platform.' : 'يتطلب ضبط سجل CNAME في لوحة تحكم النطاق الخاص بك.'}
                                    </p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label className="label">{isEnglish ? 'Theme Color' : 'لون الهوية'}</label>
                                        <input 
                                            type="color" 
                                            style={{ width: '100%', height: '40px', padding: '0', border: 'none', background: 'none', cursor: 'pointer' }} 
                                            value={brandingConfig.primary_color} 
                                            onChange={e => setBrandingConfig({...brandingConfig, primary_color: e.target.value})} 
                                            disabled={brandingRequest?.status === 'pending' || !isWhiteLabelPaid}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <div style={{ fontSize: '0.75rem', color: isWhiteLabelPaid ? '#10B981' : '#6B7280', padding: '8px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', width: '100%', textAlign: 'center', background: isWhiteLabelPaid ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }}>
                                            {isWhiteLabelPaid ? (isEnglish ? 'White-Label: Active' : 'الهوية المخصصة: نشطة') : (isEnglish ? 'White-Label: Inactive' : 'الهوية المخصصة: غير نشطة')}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    className={`btn btn-primary ${requestLoading ? 'loading' : ''}`} 
                                    style={{ width: '100%' }} 
                                    disabled={requestLoading || brandingRequest?.status === 'pending'}
                                >
                                    {brandingRequest?.status === 'approved' ? (isEnglish ? 'Update Live Branding' : 'تحديث الهوية النشطة') : (isEnglish ? 'Submit for Review' : 'إرسال للمراجعة')}
                                </button>
                            </form>
                            </fieldset>
                        </div>

                        {/* Preview Card */}
                        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '24px', padding: '1.5rem', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}>{isEnglish ? 'Live Preview' : 'معاينة مباشرة للعملاء'}</div>
                            
                            {/* Fake Sidebar Preview */}
                            <div style={{ background: '#111827', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `linear-gradient(135deg, ${brandingConfig.primary_color} 0%, #111827 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: `0 0 15px ${brandingConfig.primary_color}40` }}>
                                    {brandingConfig.logo_url ? <img src={brandingConfig.logo_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>AI</span>}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white' }}>{brandingConfig.brand_name || (isEnglish ? 'Your Brand' : 'علامتك التجارية')}</div>
                                    <div style={{ fontSize: '0.65rem', color: '#6B7280' }}>Dashboard Context</div>
                                </div>
                            </div>

                            {/* Fake Concierge Footer Preview */}
                            <div style={{ marginTop: 'auto', background: '#18181B', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', boxShadow: '0 -10px 25px -5px rgba(0,0,0,0.1)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#E4E4E7', marginBottom: '10px' }}>{isEnglish ? 'Chatting with Assistant...' : 'تحدث مع المساعد الذكي...'}</div>
                                <div style={{ fontSize: '0.65rem', color: '#71717A', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', fontWeight: 500 }}>
                                {isEnglish ? 'Powered by' : 'بدعم من'} <span style={{ color: brandingConfig.primary_color || '#8B5CF6' }}>{brandingConfig.brand_name || (isEnglish ? 'Smart Platform' : 'منصتنا الذكية')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

                {/* --- Help Modal: Custom Domain --- */}
                {showDomainHelp && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                        <div style={{ background: '#111827', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '2rem', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><Globe color="#8B5CF6"/> {isEnglish ? 'Domain Linking Strategy' : 'طريقة ربط النطاق الخاص'}</h3>
                                <button onClick={() => setShowDomainHelp(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><Plus style={{ transform: 'rotate(45deg)' }}/></button>
                            </div>
                            <div style={{ color: '#D1D5DB', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                <p>{isEnglish ? 'To point your custom domain to our platform, follow these steps:' : 'لربط نطاقك الخاص بمنصتنا، اتبع الخطوات التالية في لوحة تحكم النطاق (DNS):'}</p>
                                <ol style={{ paddingRight: '1.25rem', marginTop: '1rem' }}>
                                    <li>{isEnglish ? 'Log in to your DNS provider (Cloudflare, GoDaddy, etc.).' : 'قم بتسجيل الدخول لمزود النطاق الخاص بك (Cloudflare, GoDaddy, إلخ).'}</li>
                                    <li>{isEnglish ? 'Create a new CNAME record.' : 'أضف سجل CNAME جديد.'}</li>
                                    <li>{isEnglish ? 'Name/Host: Use your prefix (e.g., "app" or "chat").' : 'الاسم/المضيف: اختر البادئة (مثل "app" أو "chat").'}</li>
                                    <li>{isEnglish ? 'Target/Point to: platform.24shift.sa' : 'يوجه إلى (Target): platform.24shift.sa'}</li>
                                </ol>
                                <div style={{ background: 'rgba(139,92,246,0.1)', padding: '1rem', borderRadius: '12px', marginTop: '1.5rem', border: '1px solid rgba(139,92,246,0.2)' }}>
                                    <strong>{isEnglish ? 'Note:' : 'ملاحظة:'}</strong> {isEnglish ? 'DNS changes can take up to 24-48 hours to propagate globally.' : 'تغييرات الـ DNS قد تستغرق من 24 إلى 48 ساعة لتنتشر عالمياً.'}
                                </div>
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setShowDomainHelp(false)}>{isEnglish ? 'Got it' : 'فهمت ذلك'}</button>
                        </div>
                    </div>
                )}

                {/* --- Legal Modal: Hide Credits Agreement --- */}
                {showLegalModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <div style={{ background: '#111827', width: '100%', maxWidth: '850px', borderRadius: '32px', padding: '3rem', border: '1px solid #EC489940', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ background: '#EC489920', padding: '12px', borderRadius: '12px' }}><ShieldCheck color="#EC4899" size={32}/></div>
                                <h3 style={{ margin: 0, fontSize: '1.75rem', color: 'white' }}>{isEnglish ? 'White Label Terms of Use' : 'شروط اتفاقية العلامة البيضاء'}</h3>
                            </div>
                            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '15px', color: '#D1D5DB', fontSize: '0.95rem', lineHeight: 1.8, background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '20px' }}>
                                <p style={{ fontWeight: 800, color: 'white', marginBottom: '1rem' }}>{isEnglish ? 'By activating "Hide Credits", you agree to the following:' : 'بتفعيل خيار "إخفاء حقوق المنصة"، فإنك تقر وتوافق على البنود التالية:'}</p>
                                <ul style={{ paddingRight: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <li><strong>{isEnglish ? 'Agency Rights:' : 'حقوق الوكالة:'}</strong> {isEnglish ? 'You have the right to present this software as your own brand to your end-clients and charge them according to your pricing.' : 'لك الحق في تقديم السوفتوير كعلامة تجارية خاصة بك أمام عملائك وتحصيل الرسوم منهم حسب تسعيرك الخاص.'}</li>
                                    <li><strong>{isEnglish ? 'Platform Ownership:' : 'ملكية المنصة:'}</strong> {isEnglish ? '24Shift remains the sole owner of the source code, technology, and updates. This agreement does not transfer IP ownership.' : 'تظل منصة 24Shift هي المالك الوحيد للكود المصدري والتقنية والتحديثات. هذا الاتفاق لا ينقل ملكية الفكرية.'}</li>
                                    <li><strong>{isEnglish ? 'Liability:' : 'المسؤولية القانونية:'}</strong> {isEnglish ? 'The agency is responsible for all content, data, and support provided to its sub-accounts. 24Shift is not liable for agency-client disputes.' : 'الوكالة هي المسؤول الأول عن المحتوى والبيانات والدعم المقدم لعملائها. 24Shift غير مسؤولة عن النزاعات بين الوكيل وعملائه.'}</li>
                                    <li><strong>{isEnglish ? 'Privacy:' : 'الخصوصية:'}</strong> {isEnglish ? 'You agree to our global privacy policy regarding data handling.' : 'أنت توافق على سياسة الخصوصية العالمية الخاصة بنا فيما يتعلق بمعالجة البيانات.'} <a href="/privacy" target="_blank" style={{ color: '#EC4899', textDecoration: 'underline' }}>{isEnglish ? 'Read Policy' : 'قراءة السياسة'}</a></li>
                                    <li><strong>{isEnglish ? 'Termination:' : 'حق الإيقاف:'}</strong> {isEnglish ? '24Shift reserves the right to suspend any agency or sub-account found violating laws or terms of service.' : 'تحتفظ المنصة بحق إيقاف أي وكالة أو حساب فرعي يثبت مخالفته للقوانين أو شروط الخدمة.'}</li>
                                </ul>
                            </div>
                            
                            {!isWhiteLabelPaid && (
                                <div style={{ background: 'rgba(236,72,153,0.1)', padding: '1rem', borderRadius: '12px', marginTop: '1.5rem', border: '1px solid rgba(236,72,153,0.2)', fontSize: '0.85rem' }}>
                                    {isEnglish ? '🔒 This feature requires an active White Label subscription.' : '🔒 هذه الميزة تتطلب اشتراك "هوية بيضاء" نشط.'}
                                    <div style={{ fontWeight: 800, marginTop: '5px', color: '#EC4899' }}>$50.00 / {isEnglish ? 'month' : 'شهر'}</div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowLegalModal(false)}>{isEnglish ? 'Decline' : 'رفض'}</button>
                                {isWhiteLabelPaid ? (
                                    <button className="btn btn-primary" style={{ flex: 1, background: '#EC4899', borderColor: '#EC4899' }} onClick={() => {
                                        setBrandingConfig({...brandingConfig, hide_credits: true});
                                        setShowLegalModal(false);
                                    }}>{isEnglish ? 'I Agree' : 'أوافق على الشروط'}</button>
                                ) : (
                                    <button className={`btn btn-primary ${actionLoading ? 'loading' : ''}`} style={{ flex: 1, background: '#EC4899', borderColor: '#EC4899' }} onClick={handleWhiteLabelPayment} disabled={actionLoading}>
                                        {isEnglish ? 'Agree & Subscribe' : 'الموافقة والاشتراك'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
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
                                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setError(''); setShowAddClient(false); }}>{isEnglish ? 'Cancel' : 'إلغاء'}</button>
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
                                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setError(''); setShowTopUp(null); }}>{isEnglish ? 'Cancel' : 'إلغاء'}</button>
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
