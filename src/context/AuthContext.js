import React, { createContext, useState, useContext, useEffect } from 'react';
import {gql, useMutation} from "@apollo/client";

const AuthContext = createContext();

const UPDATE_PASSWORD_MUTATION = gql`
    mutation ChangePassword($ci: String!, $currentPassword: String!, $newPassword: String!) {
        changePassword(ci: $ci, currentPassword: $currentPassword, newPassword: $newPassword) {
            success
            message
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



export const AuthProvider = ({ children }) => {

    const [updatePasswordMutation] = useMutation(UPDATE_PASSWORD_MUTATION);

    const [user, setUser] = useState(() => {
        // Initialize from localStorage if available
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const login = async (userData) => {
        const fullUserData = {
            id: userData.id,
            ci: userData.ci,
            nombre: userData.nombre,
            apellido: userData.apellido,
            email: userData.email,
            isAdmin: userData.isAdmin,
            state: userData.state,
            role: userData.isAdmin ? 'admin' : 'user'
        };
        setUser(fullUserData);
        localStorage.setItem('user', JSON.stringify(fullUserData));
        console.log(fullUserData);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    // Optional: Sync between tabs
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'user') {
                setUser(e.newValue ? JSON.parse(e.newValue) : null);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const updatePassword = async (userId, currentPassword, newPassword) => {
        try {
            const { data } = await updatePasswordMutation({
                variables: {
                    ci: user.ci,
                    currentPassword,
                    newPassword
                }
            });

            if (!data.changePassword.success) {
                throw new Error(data.changePassword.message);
            }

            // Actualizar el usuario en el contexto
            setUser(data.changePassword.user);
            localStorage.setItem('user', JSON.stringify(data.changePassword.user));

            return data.changePassword;
        } catch (error) {
            throw new Error(error.message);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            updatePassword,
            isAuthenticated: !!user,
            isAdmin: user?.isAdmin,
            userState: user?.state
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};