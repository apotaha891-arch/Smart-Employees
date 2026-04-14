import React from 'react';

/**
 * Reusable FormInput Component
 * Types: text, email, password, number, textarea, select
 * Includes label, placeholder, error state, and helper text
 */
const FormInput = React.forwardRef(({
    label,
    type = 'text',
    placeholder = '',
    value,
    onChange,
    onBlur,
    error = '',
    helper = '',
    disabled = false,
    required = false,
    icon = null,
    className = '',
    style = {},
    options = [], // For select type
    rows = 4, // For textarea type
    ...props
}, ref) => {
    const baseStyles = {
        width: '100%',
        padding: '0.75rem 1rem',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${error ? '#FCA5A5' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '8px',
        color: 'var(--color-text-main)',
        fontSize: '0.95rem',
        fontFamily: 'inherit',
        transition: 'all 0.2s ease',
        outline: 'none',
    };

    const focusStyles = {
        '&:focus': {
            background: 'rgba(255,255,255,0.05)',
            borderColor: error ? '#FCA5A5' : 'var(--accent)',
            boxShadow: error 
                ? 'inset 0 0 0 2px rgba(239, 68, 68, 0.1)' 
                : 'inset 0 0 0 2px rgba(139, 92, 246, 0.1)',
        }
    };

    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        marginBottom: '1rem',
    };

    const labelStyle = {
        fontSize: '0.85rem',
        fontWeight: 600,
        color: 'var(--text-secondary, #D1D5DB)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
    };

    const inputWrapperStyle = {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    };

    const errorStyle = {
        fontSize: '0.75rem',
        color: '#FCA5A5',
        fontWeight: 500,
    };

    const helperStyle = {
        fontSize: '0.75rem',
        color: 'var(--text-muted, #9CA3AF)',
        fontWeight: 400,
    };

    const iconStyle = {
        position: 'absolute',
        left: '0.75rem',
        color: 'var(--text-secondary, #D1D5DB)',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
    };

    const inputStyle = {
        ...baseStyles,
        ...(icon ? { paddingLeft: '2.5rem' } : {}),
        ...style,
    };

    return (
        <div style={containerStyle}>
            {label && (
                <label style={labelStyle}>
                    {label}
                    {required && <span style={{ color: '#FCA5A5' }}>*</span>}
                </label>
            )}
            
            <div style={inputWrapperStyle}>
                {icon && <div style={iconStyle}>{icon}</div>}
                
                {type === 'textarea' ? (
                    <textarea
                        ref={ref}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={rows}
                        style={{
                            ...inputStyle,
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            lineHeight: '1.5',
                        }}
                        className={className}
                        {...props}
                    />
                ) : type === 'select' ? (
                    <select
                        ref={ref}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        disabled={disabled}
                        style={{
                            ...inputStyle,
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center',
                            paddingRight: '2rem',
                        }}
                        className={className}
                        {...props}
                    >
                        <option value="">{placeholder || 'اختر...'}</option>
                        {options.map((opt, idx) => (
                            <option key={idx} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        ref={ref}
                        type={type}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        disabled={disabled}
                        style={inputStyle}
                        className={className}
                        {...props}
                    />
                )}
            </div>

            {error && <div style={errorStyle}>{error}</div>}
            {!error && helper && <div style={helperStyle}>{helper}</div>}
        </div>
    );
});

FormInput.displayName = 'FormInput';

export default FormInput;
