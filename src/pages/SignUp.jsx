// src/pages/SignUp.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";
import Loading from "../components/Loading";
import { colors, sizes } from "../styles/theme";

const SignUp = () => {
    const [formData, setFormData] = useState({
        nombre: "",
        contrasena: "",
        confirmarContrasena: ""
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();
    const navigate = useNavigate();

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

        if (!formData.nombre.trim()) {
            newErrors.nombre = "Nombre es requerido";
        } else if (formData.nombre.length < 3) {
            newErrors.nombre = "Nombre debe tener al menos 3 caracteres";
        } else if (formData.nombre === "ADMIN") {
            newErrors.nombre = "Este nombre de usuario no está permitido";
        }

        if (!formData.contrasena) {
            newErrors.contrasena = "Contraseña es requerida";
        } else if (formData.contrasena.length < 6) {
            newErrors.contrasena = "Contraseña debe tener al menos 6 caracteres";
        }

        if (formData.contrasena !== formData.confirmarContrasena) {
            newErrors.confirmarContrasena = "Las contraseñas no coinciden";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            // Verificar si el usuario ya existe
            const storedUsers = JSON.parse(localStorage.getItem("users") || []);
            const userExists = storedUsers.some(user => user.nombre === formData.nombre);

            if (userExists) {
                throw new Error("El nombre de usuario ya está en uso");
            }

            // Crear nuevo usuario
            const newUser = {
                nombre: formData.nombre,
                contrasena: formData.contrasena,
                role: 'user'

            };

            localStorage.setItem("users", JSON.stringify([...storedUsers, newUser]));

            showNotification("Registro exitoso! Por favor inicia sesión", "success");
            navigate("/");
        } catch (error) {
            showNotification(error.message, "error");
            setErrors({ general: error.message });
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
                        label="Nombre de usuario"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        error={errors.nombre}
                        placeholder="Ingresa tu nombre de usuario"
                        autoFocus
                        required
                    />

                    <Input
                        label="Contraseña"
                        name="contrasena"
                        type="password"
                        value={formData.contrasena}
                        onChange={handleChange}
                        error={errors.contrasena}
                        placeholder="Mínimo 6 caracteres"
                        required
                    />

                    <Input
                        label="Confirmar contraseña"
                        name="confirmarContrasena"
                        type="password"
                        value={formData.confirmarContrasena}
                        onChange={handleChange}
                        error={errors.confirmarContrasena}
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
                                to="/"
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