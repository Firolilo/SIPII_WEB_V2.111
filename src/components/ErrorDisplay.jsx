// src/components/ErrorDisplay.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../styles/theme';
import Button from './Button';

const ErrorDisplay = ({ error, onRetry }) => {
    const navigate = useNavigate();

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
                textAlign: 'center',
                maxWidth: '500px'
            }}>
                <h3 style={{
                    color: colors.danger,
                    marginTop: 0
                }}>
                    Error
                </h3>
                <p style={{
                    color: colors.text,
                    marginBottom: '20px'
                }}>
                    {error.message}
                </p>
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'center'
                }}>
                    {onRetry && (
                        <Button onClick={onRetry} variant="primary">
                            Reintentar
                        </Button>
                    )}
                    <Button onClick={() => navigate('/')} variant="outline">
                        Ir al inicio
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ErrorDisplay;