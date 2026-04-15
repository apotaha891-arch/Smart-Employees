import React from 'react';

export const Card = ({ c, s = {} }) => (
    <div style={{ 
        background: 'var(--color-bg-surface)', 
        borderRadius: '13px', 
        border: '1px solid var(--color-border-subtle)', 
        padding: '1.25rem', 
        ...s 
    }}>
        {c}
    </div>
);

export const Btn = ({ onClick, disabled, children, color = '#8B5CF6', style = {} }) => (
    <button 
        onClick={onClick} 
        disabled={disabled} 
        style={{ 
            background: `linear-gradient(135deg,${color},${color}cc)`, 
            color: 'var(--color-text-main)', 
            border: 'none', 
            borderRadius: '10px', 
            padding: '10px 18px', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '8px', 
            fontWeight: 700, 
            fontSize: '0.85rem', 
            opacity: disabled ? 0.6 : 1, 
            transition: 'all 0.2s',
            ...style 
        }}
    >
        {children}
    </button>
);

export const Input = ({ value, onChange, placeholder, type = 'text', style = {} }) => (
    <input 
        type={type} 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        style={{ 
            width: '100%', 
            padding: '10px 14px', 
            background: 'var(--color-bg-input)', 
            border: '1px solid var(--color-border-subtle)', 
            borderRadius: '10px', 
            color: 'var(--color-text-main)', 
            boxSizing: 'border-box', 
            fontSize: '0.85rem', 
            fontFamily: type === 'password' ? 'monospace' : 'inherit',
            outline: 'none',
            ...style 
        }} 
    />
);

export const StatCard = ({ icon: Icon, label, value, color, sub }) => (
    <Card 
        s={{ transition: 'transform 0.2s', cursor: 'default' }}
        c={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '6px', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text-main)', letterSpacing: '-0.5px' }}>{value}</div>
                    {sub && <div style={{ fontSize: '0.75rem', color, marginTop: '4px', fontWeight: 600 }}>{sub}</div>}
                </div>
                <div style={{ 
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '12px', 
                    background: `${color}15`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: `1px solid ${color}25`
                }}>
                    <Icon size={20} color={color} />
                </div>
            </div>
        } 
    />
);

export const StatusBadge = ({ label, config }) => (
    <span style={{ 
        padding: '5px 12px', 
        borderRadius: '20px', 
        fontSize: '0.72rem', 
        fontWeight: 800,
        background: config?.bg || 'rgba(107, 114, 128, 0.15)',
        color: config?.t || '#6B7280',
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
    }}>
        {label}
    </span>
);
