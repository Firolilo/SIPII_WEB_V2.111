// src/pages/Users.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import Card from "../components/Card";
import Loading from "../components/Loading";
import { colors, sizes } from "../styles/theme";

const Users = () => {
    const { user, logout } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(null);

    useEffect(() => {
        // Simular carga de datos
        const timer = setTimeout(() => {
            const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
            setUsers(storedUsers);
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const handleDelete = async (username) => {
        if (username === "ADMIN") {
            showNotification("No puedes eliminar al usuario ADMIN", "error");
            return;
        }

        setDeleteLoading(username);

        try {
            // Simular operación asíncrona
            await new Promise(resolve => setTimeout(resolve, 500));

            const updatedUsers = users.filter(u => u.nombre !== username);
            localStorage.setItem("users", JSON.stringify(updatedUsers));
            setUsers(updatedUsers);
            showNotification(`Usuario ${username} eliminado`, "success");
        } catch (error) {
            showNotification("Error al eliminar el usuario", "error");
        } finally {
            setDeleteLoading(null);
        }
    };

    if (loading) return <Loading />;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            backgroundColor: colors.background
        }}>
            <NavBar user={user} onLogout={logout} />

            <main style={{
                flex: 1,
                padding: '20px',
                maxWidth: sizes.maxWidth,
                width: '100%',
                margin: '0 auto'
            }}>
                <h1 style={{
                    color: colors.primary,
                    textAlign: 'center',
                    marginBottom: '30px',
                    borderBottom: `3px solid ${colors.secondary}`,
                    paddingBottom: '10px'
                }}>
                    Gestión de Usuarios
                </h1>

                <Card>
                    {users.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px 20px'
                        }}>
                            <p style={{
                                color: colors.textLight,
                                fontSize: '1.2rem',
                                marginBottom: '20px'
                            }}>
                                No hay usuarios registrados
                            </p>
                            <Button
                                onClick={() => navigate('/signup')}
                                variant="outline"
                            >
                                Crear nuevo usuario
                            </Button>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '15px'
                        }}>
                            {users.map((userItem) => (
                                <Card
                                    key={userItem.nombre}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '15px'
                                    }}
                                >
                                    <div>
                                        <p style={{
                                            fontWeight: 'bold',
                                            color: colors.primary,
                                            margin: '0 0 5px'
                                        }}>
                                            {userItem.nombre}
                                        </p>
                                        <p style={{
                                            fontSize: '0.8rem',
                                            color: colors.textLight,
                                            margin: 0
                                        }}>
                                            {userItem.role || 'Usuario estándar'}
                                        </p>
                                    </div>

                                    {userItem.nombre !== "ADMIN" && (
                                        <Button
                                            onClick={() => handleDelete(userItem.nombre)}
                                            variant="danger"
                                            size="small"
                                            disabled={deleteLoading === userItem.nombre}
                                        >
                                            {deleteLoading === userItem.nombre ? (
                                                'Eliminando...'
                                            ) : (
                                                'Eliminar'
                                            )}
                                        </Button>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </Card>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '30px'
                }}>
                    <Button
                        onClick={() => navigate('/signup')}
                        variant="primary"
                    >
                        + Añadir nuevo usuario
                    </Button>
                </div>
            </main>
        </div>
    );
};

export default Users;