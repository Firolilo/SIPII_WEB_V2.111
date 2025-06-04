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
                state
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
                    email: user.email,
                    isAdmin: user.isAdmin,
                    state: user.state
                });

                showNotification(
                    `Bienvenido ${user.nombre} ${user.apellido}`,
                    'success'
                );

                const from = location.state?.from?.pathname || '/Inicio';
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
            position: 'relative',
            minHeight: '100vh',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            backgroundColor: colors.background
        }}>
            {/* Fondo imagen difuminada */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1470&q=80')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(8px)',
                zIndex: 0,
                transform: 'scale(1.05)'
            }} />

            {/* Overlay semitransparente para oscurecer un poco */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.4)',
                zIndex: 1
            }} />

            <Card style={{ width: '100%', maxWidth: '450px', position: 'relative', zIndex: 2 }}>
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
