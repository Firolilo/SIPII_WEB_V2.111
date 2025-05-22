// src/components/ErrorBoundary.js
import React, { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Error capturado:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <h2>Algo salió mal</h2>
                    <button onClick={() => window.location.reload()}>
                        Recargar página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;