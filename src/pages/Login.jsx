import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useMutation, gql } from '@apollo/client';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import Loading from '../components/Loading';
import { colors, sizes } from '../styles/theme';

const LOGIN_MUTATION = gql`
    mutation Login($ci: String!, $password: String!) {
        login(ci: $ci, password: $password) {
            user {
                id
                nombre
                apellido
                email
                ci
                isAdmin
            }
        }
    }
`;

const Login = () => {
    const [formData, setFormData] = useState({
        ci: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { login } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();

    const [loginMutation] = useMutation(LOGIN_MUTATION);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.ci.trim()) newErrors.ci = 'CI es requerido';
        if (!formData.password) newErrors.password = 'Contraseña es requerida';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);

        try {
            const { data } = await loginMutation({
                variables: {
                    ci: formData.ci,
                    password: formData.password
                }
            });

            if (data?.login?.user) {
                const user = data.login.user;
                await login({
                    id: user.id,
                    ci: user.ci,
                    nombre: user.nombre,
                    apellido: user.apellido,
                    role: user.isAdmin ? 'admin' : 'user'
                });

                showNotification(
                    `Bienvenido ${user.nombre} ${user.apellido}`,
                    'success'
                );

                const from = location.state?.from?.pathname || '/dashboard';
                navigate(from, { replace: true });
            } else {
                throw new Error('Credenciales incorrectas');
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
                        label="Cédula de Identidad"
                        name="ci"
                        value={formData.ci}
                        onChange={handleChange}
                        error={errors.ci}
                        placeholder="Ingresa tu CI"
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