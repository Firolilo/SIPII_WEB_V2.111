import React from 'react';
import { colors } from '../styles/theme';

const RangeInput = ({ value, onChange, min, max, step = 1, disabled = false }) => {
    const percent = (value - min) / (max - min) * 100;

    // Colores dinámicos según estado
    const trackColor = disabled ? colors.border : colors.primary;
    const fillColor = disabled ? '#ddd' : colors.light;

    // Estilo para el input[type=range]
    const rangeStyle = {
        width: '100%',
        height: '12px',
        borderRadius: '8px',
        background: `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${percent}%, ${fillColor} ${percent}%, ${fillColor} 100%)`,
        outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: 1,
        transition: 'background 0.3s ease',
        appearance: 'none', // Importante para estilizar
    };

    // Estilo del thumb (marcador)
    const thumbSize = 20;
    const thumbStyle = {
        width: `${thumbSize}px`,
        height: `${thumbSize}px`,
        borderRadius: '50%',
        backgroundColor: disabled ? '#aaa' : colors.primary,
        border: '2px solid white',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
        position: 'absolute',
        top: '50%',
        left: `${percent}%`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none', // No interfiere con input
        transition: 'background 0.3s ease'
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
                disabled={disabled}
                style={rangeStyle}
            />
            <div style={thumbStyle}></div>
        </div>
    );
};

export default RangeInput;
