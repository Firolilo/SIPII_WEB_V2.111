import React from 'react';
import { colors } from '../styles/theme';

const formatearConfianza = (conf) => {
    switch (conf) {
        case 'l': return 'Baja';
        case 'n': return 'Media';
        case 'h': return 'Alta';
        default: return 'Desconocida';
    }
};

const agruparPorProximidad = (fires, umbral = 0.1) => {
    const grupos = [];

    fires.forEach(fire => {
        const grupoExistente = grupos.find(grupo =>
            Math.abs(grupo.lat - fire.lat) <= umbral &&
            Math.abs(grupo.lng - fire.lng) <= umbral
        );

        if (grupoExistente) {
            grupoExistente.puntos.push(fire);
        } else {
            grupos.push({ lat: fire.lat, lng: fire.lng, puntos: [fire] });
        }
    });

    return grupos;
};


const FireList = ({ fires }) => {
    if (!fires || fires.length === 0) return null;

    return (
        <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
            <h3 style={{ color: colors.danger, marginTop: 0, marginBottom: '15px' }}>
                🔥 Alertas de Incendios ({fires.length})
            </h3>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '12px'
            }}>
                {agruparPorProximidad(fires).map((grupo, index) => (
                    <div key={`fire-${index}`} style={{
                        backgroundColor: colors.light,
                        padding: '10px 15px',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        borderLeft: `4px solid ${colors.danger}`,
                        fontSize: '0.95rem'
                    }}>
                        <strong style={{ marginBottom: '4px' }}>🔥 {grupo.puntos.length > 1 ? `Zona con ${grupo.puntos.length} alertas` : `Punto #${index + 1}`}</strong>
                        <span><strong>Ubicación:</strong> Lat {grupo.lat.toFixed(4)}, Lng {grupo.lng.toFixed(4)}</span>
                        <span><strong>Confianza promedio:</strong> {
                            formatearConfianza(
                                grupo.puntos.reduce((acc, p) => acc + (p.confidence === 'h' ? 3 : p.confidence === 'n' ? 2 : 1), 0) / grupo.puntos.length >= 2.5 ? 'h' :
                                    grupo.puntos.reduce((acc, p) => acc + (p.confidence === 'h' ? 3 : p.confidence === 'n' ? 2 : 1), 0) / grupo.puntos.length >= 1.5 ? 'n' : 'l'
                            )
                        }</span>
                        <span><strong>Fecha más reciente:</strong> {
                            new Date(Math.max(...grupo.puntos.map(p => new Date(p.date)))).toLocaleString()
                        }</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FireList;
