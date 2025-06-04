// src/components/StatBox.jsx
import React from 'react';
import { colors } from '../styles/theme';

const StatBox = ({ label, value, color = colors.primary }) => {
    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '15px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
        }}>
            <p style={{
                margin: 0,
                fontSize: '0.9rem',
                color: colors.textLight,
                marginBottom: '8px'
            }}>
                {label}
            </p>
            <p style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: color
            }}>
                {value}
            </p>
        </div>
    );
};

export default StatBox;