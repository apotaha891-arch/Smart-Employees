import React from 'react';

/**
 * Reusable Badge Component
 * Variants: default, primary, success, warning, danger, info
 * Can include icons and be dismissible
 */
const Badge = ({
    children,
    variant = 'default',
    size = 'md',
    icon = null,
    dismissible = false,
    onDismiss,
    className = '',
    style = {},
    ...props
}) => {
    const [dismissed, setDismissed] = React.useState(false);

    if (dismissed) return null;

    const sizeStyles = {
        sm: { padding: '0.2rem 0.5rem', fontSize: '0.7rem' },
        md: { padding: '0.3rem 0.7rem', fontSize: '0.85rem' },
        lg: { padding: '0.5rem 1rem', fontSize: '0.95rem' },
    };

    const variantStyles = {
        default: {
            background: 'rgba(255,255,255,0.1)',
            color: 'var(--color-text-main)',
            border: '1px solid var(--color-border-subtle)',
        },
        primary: {
            background: 'rgba(139, 92, 246, 0.2)',
            color: '#C4B5FD',
            border: '1px solid rgba(139, 92, 246, 0.4)',
        },
        success: {
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#86EFAC',
            border: '1px solid rgba(16, 185, 129, 0.4)',
        },
        warning: {
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#FCD34D',
            border: '1px solid rgba(245, 158, 11, 0.4)',
        },
        danger: {
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#FCA5A5',
            border: '1px solid rgba(239, 68, 68, 0.4)',
        },
        info: {
            background: 'rgba(6, 182, 212, 0.2)',
            color: '#67E8F9',
            border: '1px solid rgba(6, 182, 212, 0.4)',
        },
    };

    const combinedStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        borderRadius: '6px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        ...(sizeStyles[size] || sizeStyles.md),
        ...(variantStyles[variant] || variantStyles.default),
        ...style,
    };

    const handleDismiss = () => {
        setDismissed(true);
        if (onDismiss) onDismiss();
    };

    return (
        <span style={combinedStyle} className={className} {...props}>
            {icon && <span>{icon}</span>}
            {children}
            {dismissible && (
                <button
                    onClick={handleDismiss}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        marginLeft: '0.25rem',
                        fontSize: '1rem',
                        lineHeight: 1,
                        padding: 0,
                    }}
                >
                    ×
                </button>
            )}
        </span>
    );
};

export default Badge;
