import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getUserAgents, deleteAgent } from '../../services/agentService';
import AgentLifecycle from '../shared/AgentLifecycle';
import { Plus, Settings, Trash2, Play, Pause } from 'lucide-react';

/**
 * AgentManagement Component - Unified agent management for customers
 * Replaces scattered agent logic in Dashboard, SalonSetup, etc.
 */
const AgentManagement = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [agents, setAgents] = useState([]);
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState(null);

    useEffect(() => {
        const loadAgents = async () => {
            if (user?.id) {
                const result = await getUserAgents(user.id);
                if (result.success) {
                    setAgents(result.data || []);
                }
            }
            setLoading(false);
        };

        loadAgents();
    }, [user?.id]);

    const handleDeleteAgent = async (agentId) => {
        if (confirm(t('messages.confirmDelete'))) {
            const result = await deleteAgent(agentId);
            if (result.success) {
                setAgents(agents.filter(a => a.id !== agentId));
            }
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            {/* Lifecycle Progress */}
            <AgentLifecycle currentStep={currentStep} onStepChange={setCurrentStep} />

            {/* Content based on step */}
            {currentStep === 1 && (
                <div>
                    <h2>{t('agent.browse')}</h2>
                    {/* TODO: Show agent templates grid */}
                </div>
            )}

            {currentStep === 2 && (
                <div>
                    <h2>{t('agent.interview')}</h2>
                    {/* TODO: Show interview room */}
                </div>
            )}

            {currentStep === 3 && (
                <div>
                    <h2>{t('agent.hire')}</h2>
                    {/* TODO: Show hiring confirmation */}
                </div>
            )}

            {currentStep === 4 && (
                <div>
                    <h2>{t('agent.configuration')}</h2>
                    {/* TODO: Show agent configuration form */}
                </div>
            )}

            {/* Agents List */}
            <div style={{ marginTop: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3>{t('nav.myAgents')}</h3>
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} />
                        {t('common.add')}
                    </button>
                </div>

                {loading ? (
                    <p>{t('common.loading')}</p>
                ) : agents.length === 0 ? (
                    <p>{t('dashboard.noData')}</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                        {agents.map(agent => (
                            <div key={agent.id} className="shift-card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0 }}>{agent.name}</h4>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            title={t('common.edit')}
                                            onClick={() => setSelectedAgent(agent)}
                                            style={{ padding: '0.4rem', minWidth: 'auto' }}
                                        >
                                            <Settings size={16} />
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            title={agent.status === 'active' ? 'Pause' : 'Resume'}
                                            style={{ padding: '0.4rem', minWidth: 'auto' }}
                                        >
                                            {agent.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            title={t('common.delete')}
                                            onClick={() => handleDeleteAgent(agent.id)}
                                            style={{ padding: '0.4rem', minWidth: 'auto', color: 'var(--error)' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
                                    <strong>{t('agent.tone')}:</strong> {agent.tone}
                                </p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
                                    <strong>{t('dashboard.agentStatus')}:</strong> {agent.status}
                                </p>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    background: agent.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                                    color: agent.status === 'active' ? '#10B981' : '#8B5CF6',
                                    marginTop: '1rem'
                                }}>
                                    {agent.status === 'active' ? 'Active' : 'Paused'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentManagement;
