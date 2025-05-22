// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import Loading from '../components/Loading';
import { colors, sizes } from '../styles/theme';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { login } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.username.trim()) newErrors.username = 'Usuario es requerido';
        if (!formData.password) newErrors.password = 'Contraseña es requerida';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            // Simulación de autenticación - reemplazar con tu lógica real
            if (formData.username === 'ADMIN' && formData.password === 'ADMIN') {
                await login({
                    username: formData.username,
                    role: 'admin',
                    nombre: 'Administrador'
                });

                showNotification('Bienvenido Administrador', 'success');

                // Redirección a la página previa o al dashboard
                const from = location.state?.from?.pathname || '/dashboard';
                navigate(from, { replace: true });
            } else {
                // Verificación con usuarios almacenados
                const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
                const user = storedUsers.find(u =>
                    u.nombre === formData.username && u.contrasena === formData.password
                );

                if (user) {
                    await login({
                        username: user.nombre,
                        role: 'user',
                        name: user.nombre
                    });

                    showNotification(`Bienvenido ${user.nombre}`, 'success');
                    navigate('/dashboard', { replace: true });
                } else {
                    throw new Error('Credenciales incorrectas');
                }
            }
        } catch (error) {
            showNotification(error.message, 'error');
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: colors.background,
            padding: '20px'
        }}>
            <Card style={{ width: '100%', maxWidth: '450px' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{
                        color: colors.primary,
                        marginBottom: '10px'
                    }}>
                        SIPII
                    </h1>
                    <p style={{ color: colors.textLight }}>
                        Sistema de Prevención de Incendios e Información Integral
                    </p>
                </div>

                {errors.general && (
                    <div style={{
                        backgroundColor: `${colors.danger}20`,
                        color: colors.danger,
                        padding: '12px',
                        borderRadius: sizes.borderRadius,
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <Input
                        label="Nombre de usuario"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        error={errors.username}
                        placeholder="Ingresa tu usuario"
                        autoFocus
                        required
                    />

                    <Input
                        label="Contraseña"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        placeholder="Ingresa tu contraseña"
                        required
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        style={{ marginTop: '10px' }}
                        disabled={loading}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                    </Button>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: '16px'
                    }}>
                        <Button
                            type="button"
                            variant="text"
                            onClick={() => navigate('/signup')}
                            style={{ color: colors.primary }}
                        >
                            ¿No tienes cuenta? Regístrate
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default Login;