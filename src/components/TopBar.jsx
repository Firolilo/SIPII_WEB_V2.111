// TopBar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./sim.styles"; // O si tu CSS de la barra está en otro archivo, ponlo aquí

const TopBar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigate = (path) => {
        navigate(path);
    };

    return (
        <div className="top-bar">
            <button
                className={`button ${location.pathname === "/" ? "active" : ""}`}
                onClick={() => handleNavigate("/")}
            >
                Página Actual
            </button>
            <button
                className={`button ${location.pathname === "/futurePage1" ? "active" : ""}`}
                onClick={() => handleNavigate("/futurePage1")}
            >
                Ir a Página 1
            </button>
            <button
                className={`button ${location.pathname === "/futurePage2" ? "active" : ""}`}
                onClick={() => handleNavigate("/futurePage2")}
            >
                Ir a Página 2
            </button>
        </div>
    );
};

export default TopBar;
