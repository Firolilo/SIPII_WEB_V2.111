// src/components/Card.jsx
import React from 'react';
import { colors, sizes } from '../styles/theme';

const Card = ({ children, style = {} }) => {
    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: sizes.borderRadius,
            padding: '20px',
            boxShadow: sizes.boxShadow,
            ...style
        }}>
            {children}
        </div>
    );
};

export default Card;