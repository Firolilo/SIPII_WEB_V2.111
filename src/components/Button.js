import React from 'react';
import { colors, sizes } from '../styles/theme';

const Button = ({
                    children,
                    onClick,
                    variant = 'primary',
                    size = 'medium',
                    disabled = false,
                    fullWidth = false,
                    type = 'button',
                    style = {},
                    ...props
                }) => {
    const baseStyle = {
        padding: size === 'large' ? '12px 24px' : size === 'small' ? '8px 16px' : '10px 20px',
        borderRadius: sizes.borderRadius,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: sizes.transition,
        fontWeight: 600,
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.7 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: size === 'large' ? '1.1rem' : '1rem'
    };

    const variants = {
        primary: {
            backgroundColor: colors.primary,
            color: 'white',
            '&:hover': !disabled && { backgroundColor: '#1a252f' }
        },
        secondary: {
            backgroundColor: colors.secondary,
            color: 'white',
            '&:hover': !disabled && { backgroundColor: '#c0392b' }
        },
        outline: {
            backgroundColor: 'transparent',
            color: colors.primary,
            border: `2px solid ${colors.primary}`,
            '&:hover': !disabled && { backgroundColor: `${colors.primary}20` }
        },
        text: {
            backgroundColor: 'transparent',
            color: colors.primary,
            border: 'none',
            '&:hover': !disabled && { textDecoration: 'underline' }
        }
    };

    return (
        <button
            style={{
                ...baseStyle,
                ...variants[variant],
                ...style
            }}
            onClick={onClick}
            disabled={disabled}
            type={type}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;