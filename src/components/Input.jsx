import React from 'react';
import { colors, sizes } from '../styles/theme';

const Input = ({
                   label,
                   type = 'text',
                   name,
                   value,
                   onChange,
                   placeholder,
                   error,
                   required = false,
                   autoFocus = false,
                   ...props
               }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {label && (
                <label style={{
                    fontSize: '0.9rem',
                    color: error ? colors.danger : colors.text,
                    fontWeight: 500
                }}>
                    {label}
                    {required && <span style={{ color: colors.danger }}> *</span>}
                </label>
            )}
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                autoFocus={autoFocus}
                style={{
                    padding: '12px',
                    borderRadius: sizes.borderRadius,
                    border: `1px solid ${error ? colors.danger : `${colors.text}30`}`,
                    fontSize: '1rem',
                    transition: sizes.transition,
                    backgroundColor: 'white',
                    '&:focus': {
                        outline: 'none',
                        borderColor: colors.primary,
                        boxShadow: `0 0 0 2px ${colors.primary}20`
                    }
                }}
                {...props}
            />
            {error && (
                <span style={{
                    color: colors.danger,
                    fontSize: '0.8rem',
                    marginTop: '2px'
                }}>
          {error}
        </span>
            )}
        </div>
    );
};

export default Input;