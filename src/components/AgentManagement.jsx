import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../context/AuthContext';
import { agentService } from '../services/agentService';
import AgentLifecycle from './AgentLifecycle';
import { Plus, Edit2, Pause, Trash2, Play } from 'lucide-react';

/**
 * AgentManagement Component
 * Unified dashboard for managing digital employees/agents
 * Integrates with AgentLifecycle component for workflow visualization
 */
const AgentManagement = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [agents, setAgents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        loadAgentsAndTemplates();
    }, [user]);

    const loadAgentsAndTemplates = async () => {
        setIsLoading(true);
        try {
            // Get user's agents
            const agentsResult = await agentService.getUserAgents();
            if (agentsResult.success) {
                setAgents(agentsResult.data || []);
            }

            // Get templates
            const templatesResult = await agentService.getAgentTemplates();
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
            const result = await agentService.hireAgent({
                templateId,
                customName: `موظف جديد ${agents.length + 1}`
            });
            
            if (result.success) {
                setAgents([...agents, result.data]);
                setShowAddModal(false);
            }
        } catch (error) {
            console.error('Error adding agent:', error);
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

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Loading your digital employees...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Agent Lifecycle Workflow */}
            <div style={{ 
                background: 'rgba(139, 92, 246, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '16px',
                padding: '2rem'
            }}>
                <h3 style={{ margin: '0 0 2rem 0', fontWeight: 900, fontSize: '1.25rem' }}>
                    Digital Employee Hiring Journey
                </h3>
                <AgentLifecycle />
            </div>

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
                    <Plus size={18} /> استقطاب موظف جديد
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
                            <p style={{ color: 'var(--text-secondary)' }}>لا توجد قوالب متاحة</p>
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem',
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
                            Start by clicking "Hire New Employee" to select a template and begin the hiring journey
                        </p>
                    </div>
                ) : (
                    agents.map(agent => (
                        <div
                            key={agent.id}
                            onClick={() => setSelectedAgent(agent.id === selectedAgent ? null : agent.id)}
                            style={{
                                padding: '1.5rem',
                                background: 'var(--n8n-surface-card, rgba(255,255,255,0.03))',
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
                                {agent.templateName || 'موظف قياسي'}
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
                                        المهام
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent)' }}>
                                        {agent.taskCount || 0}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        الكفاءة
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>
                                        {agent.efficiency || 99}%
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                            }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleStatus(agent);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        background: agent.status === 'active' 
                                            ? 'rgba(107, 114, 128, 0.2)'
                                            : 'rgba(16, 185, 129, 0.2)',
                                        color: agent.status === 'active' ? '#9CA3AF' : '#86EFAC',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.25rem',
                                    }}
                                >
                                    {agent.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                                    {agent.status === 'active' ? 'إيقاف' : 'تشغيل'}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Edit agent:', agent.id);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        background: 'rgba(139, 92, 246, 0.2)',
                                        color: '#C4B5FD',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.25rem',
                                    }}
                                >
                                    <Edit2 size={14} /> تعديل
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAgent(agent.id);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        background: 'rgba(239, 68, 68, 0.2)',
                                        color: '#FCA5A5',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.25rem',
                                    }}
                                >
                                    <Trash2 size={14} /> حذف
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AgentManagement;
