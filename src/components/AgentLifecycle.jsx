import React from 'react';
import { useLanguage } from '../LanguageContext';

/**
 * AgentLifecycle Component
 * Visual representation of the 4-step agent hiring workflow
 * Steps: Browse → Interview → Hire → Customize
 */
const AgentLifecycle = () => {
    const { t } = useLanguage();

    const steps = [
        {
            number: 1,
            label: t('agentStep1Label'),
            description: t('agentStep1Desc'),
            status: 'completed',
        },
        {
            number: 2,
            label: t('agentStep2Label'),
            description: t('agentStep2Desc'),
            status: 'completed',
        },
        {
            number: 3,
            label: t('agentStep3Label'),
            description: t('agentStep3Desc'),
            status: 'active',
        },
        {
            number: 4,
            label: t('agentStep4Label'),
            description: t('agentStep4Desc'),
            status: 'pending',
        },
    ];

    const getStepColor = (status) => {
        switch (status) {
            case 'completed':
                return '#10B981'; // Green
            case 'active':
                return '#8B5CF6'; // Purple
            case 'pending':
                return '#6B7280'; // Gray
            default:
                return '#9CA3AF';
        }
    };

    const getStepBackground = (status) => {
        switch (status) {
            case 'completed':
                return 'rgba(16, 185, 129, 0.15)';
            case 'active':
                return 'rgba(139, 92, 246, 0.15)';
            case 'pending':
                return 'rgba(107, 114, 128, 0.15)';
            default:
                return 'rgba(156, 163, 175, 0.15)';
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {steps.map((step, index) => (
                <div key={step.number} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    {/* Step Circle */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: getStepBackground(step.status),
                            border: `2px solid ${getStepColor(step.status)}`,
                            color: getStepColor(step.status),
                            fontSize: '1.5rem',
                            fontWeight: 900,
                            flexShrink: 0,
                            position: 'relative',
                            boxShadow: step.status === 'active' 
                                ? `0 0 20px ${getStepColor(step.status)}44` 
                                : 'none',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        {step.number}
                        
                        {/* Status indicator dot */}
                        {step.status === 'active' && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    width: '12px',
                                    height: '12px',
                                    background: getStepColor(step.status),
                                    borderRadius: '50%',
                                    border: '2px solid #0B0F19',
                                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                                }}
                            />
                        )}
                    </div>

                    {/* Step Info */}
                    <div style={{ marginLeft: '1rem', flex: 1 }}>
                        <div style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: getStepColor(step.status),
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '0.25rem',
                        }}>
                            {t('step')} {step.number}
                        </div>
                        <h4 style={{
                            margin: '0 0 0.25rem 0',
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: 'var(--color-text-main)',
                        }}>
                            {step.label}
                        </h4>
                        <p style={{
                            margin: 0,
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            lineHeight: '1.3',
                        }}>
                            {step.description}
                        </p>
                    </div>

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                        <div style={{
                            flex: 0.2,
                            height: '3px',
                            background: steps[index + 1].status === 'completed' 
                                ? 'rgba(16, 185, 129, 0.4)' 
                                : 'rgba(107, 114, 128, 0.3)',
                            borderRadius: '2px',
                            margin: '0 0.5rem',
                            transition: 'all 0.3s ease',
                        }}
                        />
                    )}
                </div>
            ))}

            {/* Global pulse animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
                
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default AgentLifecycle;
