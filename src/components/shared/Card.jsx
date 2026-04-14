import React from 'react';

/**
 * Reusable Card Component
 * Variants: default, elevated, outlined, filled
 * Hover effects for interactivity
 */
const Card = ({
    children,
    variant = 'default',
    className = '',
    style = {},
    onClick,
    hoverable = false,
    shadow = true,
    ...props
}) => {
    const baseStyles = {
        borderRadius: '12px',
        padding: '1.5rem',
        transition: 'all 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
    };

    const variantStyles = {
        default: {
            background: 'var(--shift-surface-card, rgba(255,255,255,0.03))',
            border: '1px solid var(--shift-border, var(--color-border-subtle))',
        },
        elevated: {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid var(--color-border-subtle)',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)',
        },
        outlined: {
            background: 'transparent',
            border: '2px solid var(--accent)',
            borderRadius: '16px',
        },
        filled: {
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
        },
    };

    const hoverStyles = hoverable ? {
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(139, 92, 246, 0.2)',
        }
    } : {};

    const shadowStyle = shadow && variant === 'default' ? {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    } : {};

    const combinedStyle = {
        ...baseStyles,
        ...(variantStyles[variant] || variantStyles.default),
        ...shadowStyle,
        ...style,
    };

    // Handle hover state manually since inline styles don't support pseudo-selectors
    const [isHovered, setIsHovered] = React.useState(false);
    if (hoverable && isHovered && hoverStyles['&:hover']) {
        Object.assign(combinedStyle, hoverStyles['&:hover']);
    }

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={combinedStyle}
            className={className}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
