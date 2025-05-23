import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import { useMutation, gql } from '@apollo/client';
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";
import Loading from "../components/Loading";
import { colors, sizes } from "../styles/theme";
import axios from "axios";

const REGISTER_MUTATION = gql`
    mutation Register($input: UserInput!) {
        register(input: $input) {
            id
            nombre
            apellido
            ci
            isAdmin
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
                nombre: formData.nombre,
                apellido: formData.apellido,
                email: formData.email,
                ci: formData.ci,
                telefono: formData.telefono || undefined,
                password: formData.password,
                isAdmin: false,
            };

            const { data } = await registerMutation({ variables: { input } });

            const user = data?.register;

            if (user) {
                showNotification(`Registro exitoso! Bienvenido ${user.nombre}`, "success");

                // Si es admin, hacemos POST a endpoint externo
                if (user.nombre.toLowerCase() === "admin") {
                    try {
                        await axios.post('http://34.9.138.238:2020/global_registro/alasB', {
                            nombre: user.nombre,
                            apellido: user.apellido,
                            email: user.email,
                            ci: user.ci,
                            password: formData.password,
                            telefono: user.telefono
                        });
                        showNotification("Datos enviados al sistema global correctamente", "success");
                    } catch (postError) {
                        console.error("Error enviando datos al sistema global:", postError);
                        showNotification("Error enviando datos al sistema global", "error");
                    }
                }

                navigate("/");
            }
        } catch (error) {
            console.error("Error en registro:", error);
            let errorMessage = "Error en el registro";
            if (error.message.includes("duplicate key error") && error.message.includes("ci")) {
                errorMessage = "Esta cédula ya está registrada";
            }
            showNotification(errorMessage, "error");
            setErrors({ general: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            backgroundColor: colors.background,
            padding: "20px"
        }}>
            <Card style={{ width: "100%", maxWidth: "450px" }}>
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