// src/context/NotificationContext.js
import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {notification && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    padding: '1rem',
                    backgroundColor: notification.type === 'error' ? 'red' : 'green',
                    color: 'white',
                    borderRadius: '4px'
                }}>
                    {notification.message}
                </div>
            )}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);