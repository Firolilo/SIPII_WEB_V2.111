import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { useQuery, useMutation, gql } from '@apollo/client';
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import Card from "../components/Card";
import Loading from "../components/Loading";
import { colors, sizes } from "../styles/theme";

// Consulta GraphQL para obtener usuarios
const GET_USERS = gql`
    query GetUsers {
        users {
            id
            nombre
            apellido
            ci
            telefono
            isAdmin
            state
            createdAt
        }
    }
`;

// Mutación GraphQL para eliminar usuario
const DELETE_USER = gql`
    mutation DeleteUser($id: ID!) {
        deleteUser(id: $id) {
            id
            nombre
        }
    }
`;

const UPDATE_USER_STATE = gql`
    mutation UpdateUser($id: ID!, $input: UserInput!) {
        updateUser(id: $id, input: $input) {
            id
            nombre
            state
        }
    }
`;

// ...importaciones como ya las tienes arriba...
const Users = () => {
    const { user, logout } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [activatingId, setActivatingId] = useState(null);

    const { loading, error, data, refetch } = useQuery(GET_USERS);
    const [deleteUser] = useMutation(DELETE_USER);
    const [updateUser] = useMutation(UPDATE_USER_STATE);

    useEffect(() => {
        if (error) {
            showNotification("Error al cargar usuarios", "error");
        }
    }, [error]);

    const handleDelete = async (userId, userName) => {
        if (userName === "ADMIN") {
            showNotification("No puedes eliminar al usuario ADMIN", "error");
            return;
        }

        setDeleteLoading(userId);
        try {
            await deleteUser({ variables: { id: userId } });
            showNotification(`Usuario ${userName} eliminado`, "success");
            refetch();
        } catch {
            showNotification("Error al eliminar el usuario", "error");
        } finally {
            setDeleteLoading(null);
        }
    };

    const handleActivate = async (userId) => {
        setActivatingId(userId);
        try {
            await updateUser({
                variables: {
                    id: userId,
                    input: { state: "Pendiente" }
                }
            });
            showNotification("Usuario activado como pendiente", "success");
            refetch();
        } catch {
            showNotification("Error al activar usuario", "error");
        } finally {
            setActivatingId(null);
        }
    };

    if (loading) return <Loading />;

    const usersList = data?.users || [];
    const usersActivos = usersList.filter(u => u.state === "Activo" && !u.isAdmin);
    const usersPendientes = usersList.filter(u => u.state === "Pendiente" && !u.isAdmin);
    const usersInactivos = usersList.filter(u => u.state === "Inactivo" && !u.isAdmin);
    const usersAdmin = usersList.filter(u => u.isAdmin);

    const renderUserCard = (userItem, showDelete = false, showActivate = false) => (
        <Card
            key={userItem.id}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}
        >
            <div>
                <p style={{ fontWeight: 'bold', color: colors.primary }}>{userItem.nombre} {userItem.apellido}</p>
                <p style={{ fontSize: '0.8rem', color: colors.textLight }}>CI: {userItem.ci}</p>
                <p style={{ fontSize: '0.8rem', color: colors.textLight }}>Estado: {userItem.state}</p>
            </div>

            {showDelete && (
                <Button
                    onClick={() => handleDelete(userItem.id, userItem.nombre)}
                    variant="danger"
                    size="small"
                    disabled={deleteLoading === userItem.id}
                >
                    {deleteLoading === userItem.id ? 'Eliminando...' : 'Eliminar'}
                </Button>
            )}

            {showActivate && (
                <Button
                    onClick={() => handleActivate(userItem.id)}
                    variant="success"
                    size="small"
                    disabled={activatingId === userItem.id}
                >
                    {activatingId === userItem.id ? 'Activando...' : 'Activar'}
                </Button>
            )}
        </Card>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: colors.background }}>
            <NavBar user={user} onLogout={logout} />

            <main style={{ flex: 1, padding: '20px', maxWidth: sizes.maxWidth, width: '100%', margin: '0 auto' }}>
                <h1 style={{
                    color: colors.primary,
                    textAlign: 'center',
                    marginBottom: '30px',
                    borderBottom: `3px solid ${colors.secondary}`,
                    paddingBottom: '10px'
                }}>
                    Gestión de Usuarios
                </h1>

                <div style={{
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap'
                }}>
                    {/* Columna: Activos */}
                    <div style={{ flex: 1, minWidth: '280px' }}>
                        <h2 style={{ color: colors.success }}>🟢 Activos</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {usersActivos.length ? usersActivos.map(u => renderUserCard(u, true)) : <p>Sin usuarios activos</p>}
                        </div>
                    </div>

                    {/* Columna: Pendientes */}
                    <div style={{ flex: 1, minWidth: '280px' }}>
                        <h2 style={{ color: colors.warning }}>🟡 Pendientes</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {usersPendientes.length ? usersPendientes.map(u => renderUserCard(u, true)) : <p>Sin usuarios pendientes</p>}
                        </div>
                    </div>

                    {/* Columna: Inactivos */}
                    <div style={{ flex: 1, minWidth: '280px' }}>
                        <h2 style={{ color: colors.danger }}>🔴 Inactivos</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {usersInactivos.length ? usersInactivos.map(u => renderUserCard(u, false, true)) : <p>Sin usuarios inactivos</p>}
                        </div>
                    </div>

                    {/* Columna: Admins */}
                    <div style={{ flex: 1, minWidth: '280px' }}>
                        <h2 style={{ color: colors.info }}>🛡️ Admins</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {usersAdmin.length ? usersAdmin.map(u => renderUserCard(u)) : <p>Sin admins</p>}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                    <Button onClick={() => navigate('/signup')} variant="primary">
                        + Añadir nuevo usuario
                    </Button>
                </div>
            </main>
        </div>
    );
};


export default Users;