import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from './Button';
import { colors, fonts } from '../styles/theme';

const NavBar = ({ user, onLogout }) => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const linkStyle = (path) => ({
        color: isActive(path) ? colors.light : '#f8dada',
        fontWeight: isActive(path) ? 'bold' : 'normal',
        textDecoration: 'none',
        padding: '0.6rem 1rem',
        borderRadius: '8px',
        backgroundColor: isActive(path) ? `${colors.light}20` : 'transparent',
        transition: 'background-color 0.3s, color 0.3s',
        fontSize: '1rem',
        display: 'inline-block'
    });

    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 2rem',
            backgroundColor: colors.secondary,
            color: colors.light,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            fontFamily: fonts.primary,
            position: 'sticky',
            top: 0,
            zIndex: 1000
        }}>
            {/* Sección izquierda: Logo + Enlaces */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                {/* Nombre del software */}
                <div style={{
                    fontWeight: 'bold',
                    fontSize: '1.4rem',
                    color: colors.light,
                    letterSpacing: '1px'
                }}>
                    SIPII
                </div>

                {/* Menú */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to="/Inicio" style={linkStyle('/Inicio')}>Inicio</Link>
                    <Link to="/Datos" style={linkStyle('/Datos')}>Datos</Link>
                    <Link to="/Simulacion" style={linkStyle('/Simulacion')}>Simulación</Link>
                    <Link to="/Reporte" style={linkStyle('/Reporte')}>Reporte</Link>
                    {user?.role === 'admin' && (
                        <Link to="/Usuarios" style={linkStyle('/Usuarios')}>Usuarios</Link>
                    )}
                </div>
            </div>

            {/* Sección derecha: Usuario + Cerrar sesión */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                    {user?.nombre || 'Usuario'}
                </span>
                <Button onClick={onLogout} variant="secondary" size="small">
                    Cerrar sesión
                </Button>
            </div>
        </nav>
    );
};

export default NavBar;
