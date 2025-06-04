// src/components/Loading.jsx
import React from 'react';
import { colors } from '../styles/theme';

const Loading = () => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: colors.background
        }}>
            <div style={{
                padding: '40px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                textAlign: 'center'
            }}>
                <p style={{
                    fontSize: '1.2rem',
                    color: colors.primary
                }}>
                    Cargando datos...
                </p>
            </div>
        </div>
    );
};

export default Loading;