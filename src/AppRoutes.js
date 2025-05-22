// src/AppRoutes.js
import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Loading from './components/Loading';

// Importaciones lazy para code splitting
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SecondPage = lazy(() => import('./pages/SecondPage'));
const NewPage = lazy(() => import('./pages/Simulacion'));
const Biomasa = lazy(() => import('./pages/Biomasa'));
const Users = lazy(() => import('./pages/Users'));

const AppRoutes = () => {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                {/* Rutas públicas */}
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />

                {/* Rutas privadas */}
                <Route path="/dashboard" element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                } />

                <Route path="/secondPage" element={
                    <PrivateRoute>
                        <SecondPage />
                    </PrivateRoute>
                } />

                <Route path="/newPage" element={
                    <PrivateRoute>
                        <NewPage />
                    </PrivateRoute>
                } />

                <Route path="/reporte" element={
                    <PrivateRoute>
                        <Biomasa />
                    </PrivateRoute>
                } />

                <Route path="/users" element={
                    <PrivateRoute>
                        <Users />
                    </PrivateRoute>
                } />
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;