import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { CheckCircle2, Circle } from 'lucide-react';

/**
 * AgentLifecycle Component - Provides clear steps for agent selection, interview, hiring, and customization
 * Replaces scattered logic and creates unified UX
 */
const AgentLifecycle = ({ onStepChange, currentStep = 1 }) => {
    const { t } = useLanguage();

    const steps = [
        {
            number: 1,
            key: 'browse',
            title: t('agent.browse'),
            description: 'Select from our templates'
        },
        {
            number: 2,
            key: 'interview',
            title: t('agent.interview'),
            description: 'Test their capabilities'
        },
        {
            number: 3,
            key: 'hire',
            title: t('agent.hire'),
            description: 'Approve and hire'
        },
        {
            number: 4,
            key: 'customize',
            title: t('agent.customize'),
            description: 'Configure settings'
        }
    ];

    const getStepStatus = (stepNumber) => {
        if (stepNumber < currentStep) return 'completed';
        if (stepNumber === currentStep) return 'active';
        return 'pending';
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            padding: '2rem',
            background: 'rgba(139, 92, 246, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(139, 92, 246, 0.1)',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            justifyContent: 'center'
        }}>
            {steps.map((step, index) => (
                <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
                    {/* Step indicator */}
                    <button
                        onClick={() => onStepChange?.(step.number)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            background: 'transparent',
                            border: 'none',
                            padding: '0.5rem'
                        }}
                        title={step.title}
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: getStepStatus(step.number) === 'completed' ? 'rgba(16, 185, 129, 0.2)' :
                                getStepStatus(step.number) === 'active' ? 'rgba(139, 92, 246, 0.2)' :
                                'rgba(139, 92, 246, 0.05)',
                            border: `2px solid ${getStepStatus(step.number) === 'completed' ? '#10B981' :
                                getStepStatus(step.number) === 'active' ? '#8B5CF6' :
                                'rgba(139, 92, 246, 0.3)'}`
                        }}>
                            {getStepStatus(step.number) === 'completed' ? (
                                <CheckCircle2 size={24} style={{ color: '#10B981' }} />
                            ) : (
                                <Circle size={24} style={{ color: getStepStatus(step.number) === 'active' ? '#8B5CF6' : 'rgba(139, 92, 246, 0.5)' }} />
                            )}
                        </div>
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: getStepStatus(step.number) === 'active' ? '#8B5CF6' : 'var(--text-muted)',
                            maxWidth: '80px',
                            textAlign: 'center'
                        }}>
                            {step.title}
                        </span>
                    </button>

                    {/* Connector line */}
                    {index < steps.length - 1 && (
                        <div style={{
                            width: '24px',
                            height: '2px',
                            background: getStepStatus(step.number) === 'completed' ? '#10B981' : 'rgba(139, 92, 246, 0.2)',
                            margin: '0 -0.5rem',
                            transition: 'all 0.3s'
                        }} />
                    )}
                </div>
            ))}
        </div>
    );
};

export default AgentLifecycle;
