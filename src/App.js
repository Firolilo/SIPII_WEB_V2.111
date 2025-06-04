// src/App.js (final)
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import client from './apolloClient';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AppRoutes from './AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
    return (
        <ErrorBoundary>
            <ApolloProvider client={client}>
                <NotificationProvider>
                    <AuthProvider>
                        <Router>
                            <AppRoutes />
                        </Router>
                    </AuthProvider>
                </NotificationProvider>
            </ApolloProvider>
        </ErrorBoundary>
    );
}

export default App;