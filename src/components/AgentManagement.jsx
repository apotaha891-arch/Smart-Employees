import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../context/AuthContext';
import { agentService } from '../services/agentService';
import { Plus, Edit2, Pause, Trash2, Play, Send, MessageCircle, Terminal, X, Loader2, BarChart3, BellRing } from 'lucide-react';
import * as geminiService from '../services/geminiService';
import * as adminService from '../services/adminService';
import { supabase } from '../services/supabaseService';

/**
 * AgentManagement Component
 * Unified dashboard for managing digital employees/agents
 * Integrates with AgentLifecycle component for workflow visualization
 */
const AgentManagement = () => {
    const { t } = useLanguage();
    const { user, isAdmin } = useAuth();
    const [agents, setAgents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [templates, setTemplates] = useState([]);

    // Telegram Token Modal State
    const [showTelegramModal, setShowTelegramModal] = useState(false);
    const [editingTelegramAgent, setEditingTelegramAgent] = useState(null);
    const [telegramToken, setTelegramToken] = useState('');
    const [isSavingToken, setIsSavingToken] = useState(false);

    // WhatsApp Settings Modal State
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [editingWhatsAppAgent, setEditingWhatsAppAgent] = useState(null);
    const [whatsappSettings, setWhatsappSettings] = useState({
        token: '',
        phoneNumberId: '',
        verifyToken: ''
    });
    const [isSavingWhatsApp, setIsSavingWhatsApp] = useState(false);

    useEffect(() => {
        loadAgentsAndTemplates();
    }, [user]);

    const loadAgentsAndTemplates = async () => {
        if (!user?.id) return; // ← Guard: skip if user not loaded yet
        setIsLoading(true);
        try {
            const agentsResult = await agentService.getUserAgents(user.id); // ← pass user.id
            if (agentsResult.success) {
                setAgents(agentsResult.data || []);
            }
            const templatesResult = await agentService.getAgentTemplates(user.id);
            if (templatesResult.success) {
                setTemplates(templatesResult.data || []);
            }
        } catch (error) {
            console.error('Error loading agents:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAgent = async (templateId) => {
        try {
            const templateDetails = templates.find(t => t.id === templateId);
            const result = await agentService.hireAgent(user.id, templateId, {
                name: `موظف جديد ${agents.length + 1}`,
                specialty: templateDetails?.specialty || 'General',
                tone: 'professional'
            });

            if (result.success) {
                setAgents([...agents, result.data]);
                setShowAddModal(false);
            } else {
                console.error("Failed to hire:", result.error);
                alert("فشل إنشاء الموظف: " + result.error);
            }
        } catch (error) {
            console.error('Error adding agent:', error);
            alert("حدث خطأ أثناء الإنشاء");
        }
    };

    const handleDeleteAgent = async (agentId) => {
        try {
            const result = await agentService.deleteAgent(agentId);
            if (result.success) {
                setAgents(agents.filter(a => a.id !== agentId));
            }
        } catch (error) {
            console.error('Error deleting agent:', error);
        }
    };

    const handleToggleStatus = async (agent) => {
        try {
            const newStatus = agent.status === 'active' ? 'paused' : 'active';
            const result = await agentService.updateAgentStatus(agent.id, newStatus);

            if (result.success) {
                setAgents(agents.map(a =>
                    a.id === agent.id ? { ...a, status: newStatus } : a
                ));
            }
        } catch (error) {
            console.error('Error updating agent status:', error);
        }
    };

    const handleSaveTelegramToken = async () => {
        if (!editingTelegramAgent) return;
        setIsSavingToken(true);
        try {
            const result = await agentService.updateAgentTelegramToken(editingTelegramAgent.id, telegramToken);
            if (result.success) {
                // Register webhook with Telegram
                if (telegramToken && telegramToken.trim() !== '') {
                    try {
                        const webhookUrl = `https://dydflepcfdrlslpxapqo.supabase.co/functions/v1/telegram-webhook?agent_id=${editingTelegramAgent.id}`;
                        const setWebhookRes = await fetch(`https://api.telegram.org/bot${telegramToken}/setWebhook?url=${webhookUrl}`);
                        const webhookData = await setWebhookRes.json();
                        if (!webhookData.ok) {
                            console.error('Failed to set webhook:', webhookData.description);
                            alert(`${t('telegramLinkingError')} ${webhookData.description}`);
                        } else {
                            alert(t('telegramLinkedSuccess'));
                        }
                    } catch (err) {
                        console.error('Error calling Telegram API:', err);
                        alert(t('telegramApiError'));
                    }
                }

                // Update local state
                setAgents(agents.map(a =>
                    a.id === editingTelegramAgent.id ? { ...a, telegram_token: telegramToken } : a
                ));
                setShowTelegramModal(false);
            } else {
                alert(t('telegramDbError'));
            }
        } catch (error) {
            console.error('Error saving telegram token:', error);
        } finally {
            setIsSavingToken(false);
        }
    };

    const handleSaveWhatsAppSettings = async () => {
        if (!editingWhatsAppAgent) return;
        setIsSavingWhatsApp(true);
        try {
            const result = await agentService.updateAgentWhatsAppSettings(editingWhatsAppAgent.id, whatsappSettings);
            if (result.success) {
                // Update local state
                setAgents(agents.map(a =>
                    a.id === editingWhatsAppAgent.id ? { ...a, whatsapp_settings: whatsappSettings } : a
                ));
                setShowWhatsAppModal(false);
                alert(t('whatsappSaveSuccess'));
            } else {
                alert(t('whatsappSaveError'));
            }
        } catch (error) {
            console.error('Error saving whatsapp settings:', error);
        } finally {
            setIsSavingWhatsApp(false);
        }
    };

    const handleOpenCommandCenter = (agent) => {
        setCommandingAgent(agent);
        setShowCommandModal(true);
        const welcomeMsg = { 
            role: 'assistant', 
            content: isEnglish 
                ? `Ready for your orders, Director. How can I assist you with the business today?` 
                : `جاهز لأوامرك يا مدير. كيف يمكنني مساعدتك في إدارة العمل اليوم؟` 
        };
        setCommandMessages([welcomeMsg]);
        
        // Initialize Gemini session for Owner Chat
        const systemPrompt = geminiService.wrapIdentity({
            name: agent.name || agent.customName,
            role: agent.templateName || 'Digital Employee',
            businessName: authUser?.business_name || '24Shift',
            additionalPrompt: `أنت الآن في وضع "مركز القيادة الإداري". أنت تتحدث مباشرة مع صاحب العمل (المدير). 
            لديك صلاحية استخدام الأدوات لتغيير أسعارك وقواعدك، أو التحكم في الحجوزات (تأكيد/إلغاء)، أو تقديم تقارير. 
            كن محترفاً ومطيعاً جداً للمدير، ولكن تذكر أن هويتك واسمك غير قابلين للتغيير.`,
            knowledge: agent.knowledge || ''
        });
        
        geminiService.initializeChat(systemPrompt, `command-${agent.id}`, true);
    };

    const handleSendCommand = async () => {
        if (!commandInput.trim() || isCommandProcessing) return;
        
        const userMsg = { role: 'user', content: commandInput };
        setCommandMessages(prev => [...prev, userMsg]);
        setCommandInput('');
        setIsCommandProcessing(true);
        
        // Define Tool Handlers
        const handlers = {
            update_agent_config: async (args) => {
                setCurrentToolAction(isEnglish ? 'Updating business rules...' : 'جاري تحديث قواعد العمل والأسعار...');
                const { success } = await agentService.updateAgentConfiguration(commandingAgent.id, {
                    knowledge: args.newKnowledge
                });
                return success ? "Configuration updated successfully in the database." : "Failed to update configuration.";
            },
            update_booking_status: async (args) => {
                setCurrentToolAction(isEnglish ? `Updating booking ${args.bookingId}...` : `جاري تحديث حالة الحجز ${args.bookingId}...`);
                const { success } = await adminService.updateBookingStatus(args.bookingId, args.status);
                if (success && args.customerMessage) {
                    await adminService.sendBookingNotification(args.bookingId, args.status);
                }
                return success ? `Booking ${args.bookingId} status changed to ${args.status}.` : "Booking update failed.";
            },
            get_business_stats: async (args) => {
                setCurrentToolAction(isEnglish ? 'Fetching live metrics...' : 'جاري استخراج إحصائيات العمل...');
                // Direct Supabase query for immediate stats
                const { data: bks } = await supabase.from('bookings').select('id, status').eq('user_id', authUser.id);
                const { data: custs } = await supabase.from('customers').select('id').eq('entity_id', commandingAgent.entity_id);
                
                return `Stats for ${args.timeRange || 'current'}: Total Bookings: ${bks?.length || 0}, Confirmed: ${bks?.filter(b => b.status === 'confirmed').length || 0}, Total Customers: ${custs?.length || 0}.`;
            }
        };

        try {
            const res = await geminiService.sendMessage(userMsg.content, `command-${commandingAgent.id}`, handlers);
            if (res.success) {
                setCommandMessages(prev => [...prev, { role: 'assistant', content: res.text }]);
            } else {
                setCommandMessages(prev => [...prev, { role: 'assistant', content: t('errorOccurred') }]);
            }
        } catch (err) {
            setCommandMessages(prev => [...prev, { role: 'assistant', content: "Error: " + err.message }]);
        } finally {
            setIsCommandProcessing(false);
            setCurrentToolAction(null);
        }
    };

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Loading your digital employees...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Add New Agent Button */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button
                    onClick={() => setShowAddModal(!showAddModal)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: 'var(--accent)',
                        color: 'black',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                    <Plus size={18} /> {t('hireNewEmployeeAlert')}
                </button>
            </div>

            {/* Templates Grid - Shown when Add button clicked */}
            {showAddModal && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '1rem',
                    padding: '1.5rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}>
                    {templates.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                            <p style={{ color: 'var(--text-secondary)' }}>{t('noTemplatesAvailable')}</p>
                        </div>
                    ) : (
                        templates.map(template => (
                            <div
                                key={template.id}
                                onClick={() => handleAddAgent(template.id)}
                                style={{
                                    padding: '1.5rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                                    e.currentTarget.style.borderColor = 'var(--accent)';
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                                    {template.icon}
                                </div>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700 }}>
                                    {template.name || template.title}
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {template.description}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Agents List */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem',
                overflow: 'hidden',
            }}>
                {agents.length === 0 ? (
                    <div style={{
                        gridColumn: '1/-1',
                        textAlign: 'center',
                        padding: '3rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        border: '2px dashed rgba(255,255,255,0.1)',
                    }}>
                        <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                            No digital employees hired yet
                        </h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            {t('startHiringDesc')}
                        </p>
                    </div>
                ) : (
                    agents.map(agent => (
                        <div
                            key={agent.id}
                            onClick={() => setSelectedAgent(agent.id === selectedAgent ? null : agent.id)}
                            style={{
                                padding: '1.5rem',
                                background: 'var(--shift-surface-card, rgba(255,255,255,0.03))',
                                border: selectedAgent === agent.id
                                    ? '2px solid var(--accent)'
                                    : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                position: 'relative',
                            }}
                            onMouseEnter={(e) => {
                                if (selectedAgent !== agent.id) {
                                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedAgent !== agent.id) {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }
                            }}
                        >
                            {/* Status Badge */}
                            <div style={{
                                position: 'absolute',
                                top: '1rem',
                                left: '1rem',
                                padding: '0.25rem 0.75rem',
                                background: agent.status === 'active'
                                    ? 'rgba(16, 185, 129, 0.2)'
                                    : 'rgba(107, 114, 128, 0.2)',
                                color: agent.status === 'active' ? '#86EFAC' : '#9CA3AF',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                            }}>
                                {agent.status === 'active' ? 'Active' : 'Paused'}
                            </div>

                            {/* Agent Icon */}
                            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                                {agent.icon}
                            </div>

                            {/* Agent Name */}
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800 }}>
                                {agent.name || agent.customName}
                            </h4>

                            {/* Agent Type */}
                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {agent.templateName || t('standardEmployee')}
                            </p>

                            {/* Stats */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.5rem',
                                marginBottom: '1rem',
                                padding: '1rem',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '8px',
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        {t('tasksLabel')}
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent)' }}>
                                        {agent.taskCount || 0}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        {t('efficiencyLabel')}
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>
                                        {agent.efficiency || 99}%
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons — two rows */}
                            {/* Row 1: Utility actions */}
                            <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                            }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleStatus(agent);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '0.45rem 0.5rem',
                                        background: agent.status === 'active'
                                            ? 'rgba(107, 114, 128, 0.2)'
                                            : 'rgba(16, 185, 129, 0.2)',
                                        color: agent.status === 'active' ? '#9CA3AF' : '#86EFAC',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.25rem',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {agent.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
                                    {agent.status === 'active' ? t('stopAction') : t('startAction')}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAgent(agent.id);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '0.45rem 0.5rem',
                                        background: 'rgba(239, 68, 68, 0.2)',
                                        color: '#FCA5A5',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.25rem',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <Trash2 size={13} /> {t('deleteAction')}
                                </button>
                            </div>

                            {/* Row 2: Integration actions */}
                            <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                            }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenCommandCenter(agent);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem 1rem',
                                        background: 'rgba(139, 92, 246, 0.2)',
                                        color: '#A78BFA',
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        marginBottom: '0.75rem',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    <Terminal size={15} /> {isEnglish ? 'Command Agent' : 'أمر الموظف الذكي ⚡'}
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingTelegramAgent(agent);
                                        setTelegramToken(agent.telegram_token || '');
                                        setShowTelegramModal(true);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '0.45rem 0.5rem',
                                        background: 'rgba(56, 189, 248, 0.2)',
                                        color: '#38BDF8',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.25rem',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <Send size={13} /> {t('linkTelegramAction')}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingWhatsAppAgent(agent);
                                        setWhatsappSettings(agent.whatsapp_settings || { token: '', phoneNumberId: '', verifyToken: '' });
                                        setShowWhatsAppModal(true);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '0.45rem 0.5rem',
                                        background: 'rgba(34, 197, 94, 0.2)',
                                        color: '#22C55E',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.25rem',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <MessageCircle size={13} /> {t('linkWhatsAppAction')}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Telegram Token Modal */}
            {showTelegramModal && editingTelegramAgent && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div className="card animate-fade-in" style={{
                        maxWidth: '500px', width: '100%',
                        background: '#18181B', border: '1px solid rgba(255,255,255,0.1)',
                        padding: '2rem', borderRadius: '16px'
                    }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'white' }}>
                            {t('telegramModalTitle')}
                        </h3>
                        <p style={{ color: '#A1A1AA', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            {t('telegramModalDesc').split('{name}')[0]}
                            {editingTelegramAgent.name}
                            {t('telegramModalDesc').split('{name}')[1]}
                        </p>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="label">{t('telegramBotTokenLabel')}</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder={t('telegramPlaceholder')}
                                value={telegramToken}
                                onChange={(e) => setTelegramToken(e.target.value)}
                                style={{ background: '#27272A', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowTelegramModal(false)}
                                className="btn"
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'white',
                                    padding: '0.75rem 1.5rem',
                                }}
                            >
                                {t('cancelBtn')}
                            </button>
                            <button
                                onClick={handleSaveTelegramToken}
                                disabled={isSavingToken || !telegramToken.trim()}
                                className="btn"
                                style={{
                                    background: '#0088cc',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {isSavingToken ? t('savingBtn') : <><Send size={18} /> {t('saveAndActivateTelegram')}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* WhatsApp Token Modal */}
            {showWhatsAppModal && editingWhatsAppAgent && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div className="card animate-fade-in" style={{
                        maxWidth: '500px', width: '100%',
                        background: '#18181B', border: '1px solid rgba(255,255,255,0.1)',
                        padding: '2rem', borderRadius: '16px'
                    }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'white' }}>
                            {t('whatsappModalTitle')}
                        </h3>
                        <p style={{ color: '#A1A1AA', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            {t('whatsappModalDesc')}
                        </p>

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="label">{t('whatsappAccessTokenLabel')}</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder={t('whatsappTokenPlaceholder')}
                                value={whatsappSettings.token}
                                onChange={(e) => setWhatsappSettings({ ...whatsappSettings, token: e.target.value })}
                                style={{ background: '#27272A', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="label">{t('whatsappPhoneIdLabel')}</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder={t('whatsappPhoneIdPlaceholder')}
                                value={whatsappSettings.phoneNumberId}
                                onChange={(e) => setWhatsappSettings({ ...whatsappSettings, phoneNumberId: e.target.value })}
                                style={{ background: '#27272A', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="label">{t('whatsappVerifyTokenLabel')}</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder={t('whatsappVerifyTokenPlaceholder')}
                                value={whatsappSettings.verifyToken}
                                onChange={(e) => setWhatsappSettings({ ...whatsappSettings, verifyToken: e.target.value })}
                                style={{ background: '#27272A', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowWhatsAppModal(false)}
                                className="btn"
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'white',
                                    padding: '0.75rem 1.5rem',
                                }}
                            >
                                {t('cancelBtn')}
                            </button>
                            <button
                                onClick={handleSaveWhatsAppSettings}
                                disabled={isSavingWhatsApp || !whatsappSettings.token || !whatsappSettings.phoneNumberId}
                                className="btn"
                                style={{
                                    background: '#22c55e',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {isSavingWhatsApp ? t('whatsappSavingBtn') : <><MessageCircle size={18} /> {t('saveWhatsappSettings')}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Owner-Agent Command Center Modal */}
            {showCommandModal && commandingAgent && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1.5rem'
                }}>
                    <div className="card animate-fade-in" style={{
                        maxWidth: '700px', width: '100%', height: '80vh',
                        background: '#111827', border: '1px solid rgba(139, 92, 246, 0.3)',
                        padding: 0, borderRadius: '20px', display: 'flex', flexDirection: 'column',
                        overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            background: 'rgba(139, 92, 246, 0.1)',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontSize: '1.5rem' }}>{commandingAgent.icon}</div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                                        {commandingAgent.name || commandingAgent.customName}
                                    </h3>
                                    <div style={{ fontSize: '0.75rem', color: '#A78BFA', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Terminal size={12} /> {isEnglish ? 'ADMIN COMMAND CENTER' : 'مركز القيادة الإداري'}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowCommandModal(false)}
                                style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div style={{
                            flex: 1, padding: '1.5rem', overflowY: 'auto',
                            display: 'flex', flexDirection: 'column', gap: '1rem'
                        }}>
                            {commandMessages.map((msg, i) => (
                                <div key={i} style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    padding: '0.85rem 1.1rem',
                                    borderRadius: '14px',
                                    background: msg.role === 'user' ? '#8B5CF6' : '#1F2937',
                                    color: 'white',
                                    fontSize: '0.92rem',
                                    lineHeight: 1.5,
                                    border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    {msg.content}
                                </div>
                            ))}
                            {isCommandProcessing && (
                                <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '10px', color: '#A78BFA', fontSize: '0.85rem', background: 'rgba(139, 92, 246, 0.05)', padding: '0.5rem 1rem', borderRadius: '10px' }}>
                                    <Loader2 size={16} className="animate-spin" />
                                    {currentToolAction || (isEnglish ? 'AI is processing...' : 'الموظف يقوم بالتنفيذ...')}
                                </div>
                            )}
                        </div>

                        {/* Suggested Actions */}
                        {!isCommandProcessing && commandMessages.length < 3 && (
                            <div style={{ padding: '0 1.5rem 1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {[
                                    isEnglish ? "What's our latest stats?" : "ما هي آخر الإحصائيات؟",
                                    isEnglish ? "Summarize current bookings" : "لخص لي الحجوزات الحالية",
                                    isEnglish ? "Update the price list" : "حدث قائمة الأسعار"
                                ].map((hint, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => { setCommandInput(hint); }}
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '5px 12px', fontSize: '0.75rem', color: '#D1D5DB', cursor: 'pointer' }}
                                    >
                                        {hint}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            background: '#0F172A',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex', gap: '10px'
                        }}>
                            <input 
                                type="text"
                                style={{
                                    flex: 1, background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px', padding: '0.75rem 1rem', color: 'white', fontSize: '0.9rem'
                                }}
                                placeholder={isEnglish ? "Give a command to your employee..." : "أعطِ أمراً لموظفك الرقمي..."}
                                value={commandInput}
                                onChange={(e) => setCommandInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
                            />
                            <button 
                                onClick={handleSendCommand}
                                disabled={isCommandProcessing || !commandInput.trim()}
                                style={{
                                    width: '45px', height: '45px', borderRadius: '10px',
                                    background: '#8B5CF6', color: 'white', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                    border: 'none', opacity: (isCommandProcessing || !commandInput.trim()) ? 0.5 : 1
                                }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentManagement;
