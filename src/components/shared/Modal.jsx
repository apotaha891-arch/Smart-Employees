import React from 'react';
import { X } from 'lucide-react';

/**
 * Reusable Modal Component
 * Shows overlaid content with optional close button
 */
const Modal = ({
    isOpen,
    onClose,
    title = '',
    children,
    footer = null,
    size = 'md',
    closeOnBackdrop = true,
    className = '',
    style = {},
    ...props
}) => {
    if (!isOpen) return null;

    const sizeStyles = {
        sm: { maxWidth: '400px' },
        md: { maxWidth: '600px' },
        lg: { maxWidth: '800px' },
        xl: { maxWidth: '1000px' },
        full: { maxWidth: '90%', maxHeight: '90vh' },
    };

    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out',
    };

    const modalStyle = {
        background: 'var(--shift-surface-card, rgba(15, 15, 30, 0.95))',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        overflowY: 'auto',
        ...(sizeStyles[size] || sizeStyles.md),
        ...style,
    };

    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
    };

    const titleStyle = {
        fontSize: '1.25rem',
        fontWeight: 900,
        color: 'white',
        margin: 0,
    };

    const closeButtonStyle = {
        background: 'none',
        border: 'none',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        padding: '0.5rem',
    };

    const bodyStyle = {
        padding: '1.5rem',
        flex: 1,
        overflowY: 'auto',
    };

    const footerStyle = {
        display: 'flex',
        gap: '1rem',
        justifyContent: 'flex-end',
        padding: '1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0, 0, 0, 0.2)',
    };

    const handleBackdropClick = (e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div style={overlayStyle} onClick={handleBackdropClick}>
            <div style={modalStyle} className={className} {...props}>
                {(title || onClose) && (
                    <div style={headerStyle}>
                        <h2 style={titleStyle}>{title}</h2>
                        {onClose && (
                            <button onClick={onClose} style={closeButtonStyle} aria-label="Close">
                                <X size={24} />
                            </button>
                        )}
                    </div>
                )}
                
                <div style={bodyStyle}>
                    {children}
                </div>

                {footer && (
                    <div style={footerStyle}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
