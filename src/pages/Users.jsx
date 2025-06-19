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
import styled from 'styled-components';

// Estilos para el fondo blureado (sin cambios)
const backdropStyles = {
    backgroundImage: "url('https://i.imgur.com/DYET2fG_d.webp?maxwidth=760&fidelity=grand')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "blur(10px)",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: -2,
    transform: "scale(1.05)"
};

const overlayStyles = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: -1
};

const containerStyles = {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    position: "relative",
    zIndex: 1,
    backgroundColor: "transparent"
};

// Componentes estilizados (agregamos SearchContainer)
const MainContainer = styled.main`
    flex: 1;
    padding: 20px;
    max-width: ${sizes.maxWidth};
    width: 100%;
    margin: 20px auto;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(5px);
`;

const Title = styled.h1`
    color: ${colors.primary};
    text-align: center;
    margin-bottom: 30px;
    border-bottom: 3px solid ${colors.secondary};
    padding-bottom: 10px;
`;

const SearchContainer = styled.div`
    display: flex;
    margin-bottom: 20px;
    gap: 10px;

    input {
        flex: 1;
        padding: 10px 15px;
        border: 1px solid ${colors.border};
        border-radius: 4px;
        font-size: 1rem;

        &:focus {
            outline: none;
            border-color: ${colors.primary};
        }
    }
`;

const ColumnsContainer = styled.div`
    display: flex;
    gap: 20px;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
`;

const Column = styled.div`
    flex: 1;
    min-width: 280px;
    background-color: rgba(255, 255, 255, 0.7);
    padding: 15px;
    border-radius: 8px;
`;

const ColumnTitle = styled.h2`
    margin-top: 0;
    padding-bottom: 10px;
    border-bottom: 2px solid ${props => props.color};
`;

const UserList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
`;

const UserCard = styled(Card)`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background-color: rgba(255, 255, 255, 0.85);
`;

const UserInfo = styled.div`
    flex: 1;
`;

const UserName = styled.p`
    font-weight: bold;
    color: ${colors.primary};
    margin: 0;
`;

const UserDetail = styled.p`
    font-size: 0.8rem;
    color: ${colors.textLight};
    margin: 5px 0 0;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 40px;
`;

// Consultas GraphQL (sin cambios)
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

const Users = () => {
    const { user, logout } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [activatingId, setActivatingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

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

    const filterUsers = (users, searchTerm) => {
        if (!searchTerm) return users;

        const term = searchTerm.toLowerCase();
        return users.filter(u =>
            u.nombre.toLowerCase().includes(term) ||
            u.apellido.toLowerCase().includes(term) ||
            u.ci.toLowerCase().includes(term)
        );
    };

    if (loading) return <Loading />;

    const usersList = data?.users || [];
    const filteredUsers = filterUsers(usersList, searchTerm);

    const usersActivos = filteredUsers.filter(u => u.state === "Activo" && !u.isAdmin);
    const usersPendientes = filteredUsers.filter(u => u.state === "Pendiente" && !u.isAdmin);
    const usersInactivos = filteredUsers.filter(u => u.state === "Inactivo" && !u.isAdmin);
    const usersAdmin = filteredUsers.filter(u => u.isAdmin);

    const renderUserCard = (userItem, showDelete = false, showActivate = false) => (
        <UserCard key={userItem.id}>
            <UserInfo>
                <UserName>{userItem.nombre} {userItem.apellido}</UserName>
                <UserDetail>CI: {userItem.ci}</UserDetail>
                <UserDetail>Estado: {userItem.state}</UserDetail>
            </UserInfo>

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
        </UserCard>
    );

    return (
        <div style={containerStyles}>
            {/* Capas de fondo */}
            <div style={backdropStyles} />
            <div style={overlayStyles} />

            <NavBar user={user} onLogout={logout} />

            <MainContainer>
                <Title>Gestión de Usuarios</Title>

                {/* Barra de búsqueda */}
                <SearchContainer>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellido o CI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button
                        variant="secondary"
                        onClick={() => setSearchTerm("")}
                        disabled={!searchTerm}
                    >
                        Limpiar
                    </Button>
                </SearchContainer>

                <ColumnsContainer>
                    {/* Columna: Activos */}
                    <Column>
                        <ColumnTitle color={colors.success}>🟢 Activos ({usersActivos.length})</ColumnTitle>
                        <UserList>
                            {usersActivos.length ?
                                usersActivos.map(u => renderUserCard(u, true)) :
                                <p>No hay usuarios activos{searchTerm && ` que coincidan con "${searchTerm}"`}</p>
                            }
                        </UserList>
                    </Column>

                    {/* Columna: Pendientes */}
                    <Column>
                        <ColumnTitle color={colors.warning}>🟡 Pendientes ({usersPendientes.length})</ColumnTitle>
                        <UserList>
                            {usersPendientes.length ?
                                usersPendientes.map(u => renderUserCard(u, true)) :
                                <p>No hay usuarios pendientes{searchTerm && ` que coincidan con "${searchTerm}"`}</p>
                            }
                        </UserList>
                    </Column>

                    {/* Columna: Inactivos */}
                    <Column>
                        <ColumnTitle color={colors.danger}>🔴 Inactivos ({usersInactivos.length})</ColumnTitle>
                        <UserList>
                            {usersInactivos.length ?
                                usersInactivos.map(u => renderUserCard(u, false, true)) :
                                <p>No hay usuarios inactivos{searchTerm && ` que coincidan con "${searchTerm}"`}</p>
                            }
                        </UserList>
                    </Column>

                    {/* Columna: Admins */}
                    <Column>
                        <ColumnTitle color={colors.info}>🛡️ Admins ({usersAdmin.length})</ColumnTitle>
                        <UserList>
                            {usersAdmin.length ?
                                usersAdmin.map(u => renderUserCard(u)) :
                                <p>No hay administradores{searchTerm && ` que coincidan con "${searchTerm}"`}</p>
                            }
                        </UserList>
                    </Column>
                </ColumnsContainer>

                <ButtonContainer>
                    <Button onClick={() => navigate('/signup')} variant="primary">
                        + Añadir nuevo usuario
                    </Button>
                </ButtonContainer>
            </MainContainer>
        </div>
    );
};

export default Users;