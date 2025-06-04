import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import { useMutation, gql } from '@apollo/client';
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";
import Loading from "../components/Loading";
import { colors, sizes } from "../styles/theme";

const REGISTER_MUTATION = gql`
    mutation Register($input: UserInput!) {
        register(input: $input) {
            id
            nombre
            apellido
            ci
            isAdmin
            state
        }
    }
`;

const SignUp = () => {
    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        email: "",
        ci: "",
        telefono: "",
        password: "",
        confirmPassword: ""
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [registerMutation] = useMutation(REGISTER_MUTATION);

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

        if (!formData.nombre.trim()) {
            newErrors.nombre = "Nombre es requerido";
        } else if (formData.nombre.length < 3) {
            newErrors.nombre = "Nombre debe tener al menos 3 caracteres";
        }

        if (!formData.apellido.trim()) {
            newErrors.apellido = "Apellido es requerido";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email es requerido";
        }

        if (!formData.ci.trim()) {
            newErrors.ci = "Cédula de identidad es requerida";
        } else if (!/^\d{5,10}$/.test(formData.ci)) {
            newErrors.ci = "CI debe contener solo números (5-10 dígitos)";
        }

        if (!formData.password) {
            newErrors.password = "Contraseña es requerida";
        } else if (formData.password.length < 6) {
            newErrors.password = "Contraseña debe tener al menos 6 caracteres";
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Las contraseñas no coinciden";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);

        try {
            const input = {
                nombre: formData.nombre.trim(),
                apellido: formData.apellido.trim(),
                email: formData.email.trim().toLowerCase(),
                ci: formData.ci.trim(),
                telefono: formData.telefono ? formData.telefono.trim() : undefined,
                password: formData.password,
                isAdmin: false // Default to false unless it's a special admin registration
            };

            const { data } = await registerMutation({
                variables: { input },
                errorPolicy: 'all'
            });

            if (data?.register) {
                showNotification(`Registro exitoso! Bienvenido ${data.register.nombre}`, "success");
                navigate("/login");
            }
        } catch (error) {
            let errorMessage = "Error en el registro";
            if (error.networkError?.result?.errors) {
                errorMessage = error.networkError.result.errors[0].message;
            } else if (error.message.includes("duplicate key error")) {
                if (error.message.includes("ci")) {
                    errorMessage = "Esta cédula ya está registrada";
                } else if (error.message.includes("email")) {
                    errorMessage = "Este email ya está registrado";
                }
            }
            showNotification(errorMessage, "error");
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
                backgroundImage: `url('https://i.imgur.com/OrDoqx5_d.webp?maxwidth=1520&fidelity=grand')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(8px)',
                zIndex: 0,
                transform: 'scale(1.05)'
            }} />

            {/* Overlay semitransparente para contraste */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.4)',
                zIndex: 1
            }} />

            <Card style={{ width: "100%", maxWidth: "450px", position: 'relative', zIndex: 2 }}>
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                    <h1 style={{
                        color: colors.primary,
                        marginBottom: "10px"
                    }}>
                        Crear cuenta
                    </h1>
                    <p style={{ color: colors.textLight }}>
                        Únete a nuestro sistema de monitoreo
                    </p>
                </div>

                {errors.general && (
                    <div style={{
                        backgroundColor: `${colors.danger}20`,
                        color: colors.danger,
                        padding: "12px",
                        borderRadius: sizes.borderRadius,
                        marginBottom: "20px",
                        textAlign: "center"
                    }}>
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <Input
                        label="Nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        error={errors.nombre}
                        placeholder="Ingresa tu nombre completo"
                        autoFocus
                        required
                    />

                    <Input
                        label="Apellido"
                        name="apellido"
                        value={formData.apellido}
                        onChange={handleChange}
                        error={errors.apellido}
                        placeholder="Ingresa tu apellido"
                        required
                    />

                    <Input
                        label="Email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        placeholder="Ingresa tu email"
                        required
                    />

                    <Input
                        label="Cédula de Identidad"
                        name="ci"
                        value={formData.ci}
                        onChange={handleChange}
                        error={errors.ci}
                        placeholder="Ingresa tu CI (solo números)"
                        required
                    />

                    <Input
                        label="Teléfono (opcional)"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="Ingresa tu teléfono"
                    />

                    <Input
                        label="Contraseña"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        placeholder="Mínimo 6 caracteres"
                        required
                    />

                    <Input
                        label="Confirmar contraseña"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={errors.confirmPassword}
                        placeholder="Confirma tu contraseña"
                        required
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        style={{ marginTop: "10px" }}
                        disabled={loading}
                    >
                        {loading ? "Registrando..." : "Registrarse"}
                    </Button>

                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: "16px"
                    }}>
                        <span style={{ color: colors.textLight }}>
                            ¿Ya tienes cuenta?{" "}
                            <Link
                                to="/Login"
                                style={{
                                    color: colors.primary,
                                    textDecoration: "none",
                                    fontWeight: 600
                                }}
                            >
                                Inicia sesión
                            </Link>
                        </span>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default SignUp;
