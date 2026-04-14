import React from 'react';

/**
 * Reusable Button Component
 * Variants: primary, secondary, danger, ghost, success, warning
 * Sizes: sm, md, lg
 */
const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon = null,
    fullWidth = false,
    className = '',
    onClick,
    type = 'button',
    style = {},
    ...props
}) => {
    const baseStyles = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        border: 'none',
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 600,
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.6 : 1,
    };

    const sizeStyles = {
        sm: { padding: '0.5rem 1rem', fontSize: '0.85rem' },
        md: { padding: '0.75rem 1.5rem', fontSize: '0.95rem' },
        lg: { padding: '1rem 2rem', fontSize: '1rem' },
    };

    const variantStyles = {
        primary: {
            background: 'var(--accent)',
            color: 'black',
            border: '1px solid var(--accent)',
            '&:hover': { opacity: 0.9, transform: 'translateY(-2px)' },
        },
        secondary: {
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--color-text-main)',
            border: '1px solid var(--border-subtle)',
            '&:hover': { background: 'rgba(255,255,255,0.1)' },
        },
        danger: {
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#FCA5A5',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            '&:hover': { background: 'rgba(239, 68, 68, 0.2)' },
        },
        success: {
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#86EFAC',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            '&:hover': { background: 'rgba(16, 185, 129, 0.2)' },
        },
        warning: {
            background: 'rgba(245, 158, 11, 0.1)',
            color: '#FCD34D',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            '&:hover': { background: 'rgba(245, 158, 11, 0.2)' },
        },
        ghost: {
            background: 'transparent',
            color: 'var(--accent)',
            border: 'none',
            '&:hover': { opacity: 0.8 },
        },
    };

    const combinedStyle = {
        ...baseStyles,
        ...(sizeStyles[size] || sizeStyles.md),
        ...(variantStyles[variant] || variantStyles.primary),
        width: fullWidth ? '100%' : 'auto',
        ...style,
    };

    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            style={combinedStyle}
            className={className}
            {...props}
        >
            {loading ? (
                <>
                    <span
                        style={{
                            display: 'inline-block',
                            width: '1em',
                            height: '1em',
                            borderRadius: '50%',
                            border: '2px solid currentColor',
                            borderTopColor: 'transparent',
                            animation: 'spin 0.6s linear infinite',
                        }}
                    />
                    {children}
                </>
            ) : (
                <>
                    {icon && <span>{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;
