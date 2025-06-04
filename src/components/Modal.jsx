import React from 'react';
import { colors } from '../styles/theme';

const Modal = ({
                   isOpen,
                   onClose,
                   title,
                   children,
                   disableClose = false,
                   width = '500px',

               }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
        }}>
            <div style={{
                backgroundColor: colors.background,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                width: width,
                maxWidth: '90%',
                maxHeight: '90vh',
                overflow: 'auto'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: `1px solid ${colors.border}`
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '1.2rem',
                        color: colors.text
                    }}>
                        {title}
                    </h3>
                    {!disableClose && (
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                color: colors.textLight
                            }}
                        >
                            &times;
                        </button>
                    )}
                </div>
                <div style={{ padding: '20px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;