import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getWeatherData } from '../services/weatherAPI';
import { getFireData } from '../services/firmsAPI';
import NavBar from '../components/NavBar';
import StatBox from '../components/StatBox';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/ErrorDisplay';
import BiomasaList from "../components/BiomasaList";
import FireList from '../components/FireList';
import ChangePasswordModal from "../components/ChangePasswordModal";

import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import styled from "styled-components";
import { colors, tipoBiomasaColors } from '../styles/theme';

// Configuración de iconos (se mantiene igual)
const iconoBaja = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const iconoMedia = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const iconoAlta = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// Estilos para el fondo blureado
const backdropStyles = {
    backgroundImage: "url('https://i.imgur.com/WY1G5Tz_d.webp?maxwidth=1520&fidelity=grand')",
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

// Componente para redimensionar el mapa
function MapResizer() {
    const map = useMap();

    useEffect(() => {
        const timeout = setTimeout(() => {
            map.invalidateSize();
        }, 200);

        return () => clearTimeout(timeout);
    }, [map]);

    return null;
}

// Componentes estilizados con transparencia
const MainContainer = styled.main`
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  width: 100%;
  margin: 20px auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);

  @media (min-width: 768px) {
    grid-template-columns: 2fr 1fr;
  }
`;

const MapWrapper = styled.div`
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  background-color: rgba(255, 255, 255, 0.8);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { showNotification } = useNotification();

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [biomasaData, setBiomasaData] = useState([]);
    const [filteredBiomasas, setFilteredBiomasas] = useState([]);
    const [selectedBiomasa, setSelectedBiomasa] = useState(null);
    const [weatherData, setWeatherData] = useState(null);
    const [fireData, setFireData] = useState([]);

    const defaultPosition = [-17.8, -61.5];

    useEffect(() => {
        if (user?.state === 'Pendiente') {
            setShowPasswordModal(true);
        }
    }, [user]);

    useEffect(() => {
        const storedData = JSON.parse(localStorage.getItem("biomasaReportes") || "[]");
        setBiomasaData(storedData);
        setFilteredBiomasas(storedData);
        document.title = "Dashboard - SIPII";
    }, []);

    useEffect(() => {
        const loadAllData = async () => {
            try {
                const weather = await getWeatherData(defaultPosition[0], defaultPosition[1]);
                setWeatherData(weather);

                const fires = await getFireData();
                setFireData(fires);
            } catch (err) {
                setError(err);
                showNotification("Error cargando datos", "error");
            } finally {
                setLoading(false);
            }
        };
        loadAllData();
    }, []);

    const handlePasswordUpdateSuccess = () => {
        setShowPasswordModal(false);
    };

    const handleFilteredBiomasas = (filtered) => {
        setFilteredBiomasas(filtered);
    };

    const handleDeleteBiomasa = (index) => {
        const newBiomasaData = biomasaData.filter((_, i) => i !== index);
        setBiomasaData(newBiomasaData);
        localStorage.setItem("biomasaReportes", JSON.stringify(newBiomasaData));
        showNotification("Reporte de biomasa eliminado", "success");
        if (selectedBiomasa === index) setSelectedBiomasa(null);
        else if (selectedBiomasa > index) setSelectedBiomasa(selectedBiomasa - 1);
    };

    const obtenerIconoPorConfianza = (confianza) => {
        switch (confianza) {
            case 'l': return iconoBaja;
            case 'n': return iconoMedia;
            case 'h': return iconoAlta;
            default: return iconoMedia;
        }
    };

    if (loading) return <Loading />;
    if (error) return <ErrorDisplay error={error} />;

    return (
        <div style={containerStyles}>
            {/* Capas de fondo */}
            <div style={backdropStyles} />
            <div style={overlayStyles} />

            <NavBar user={user} onLogout={logout} />

            <MainContainer>
                <ChangePasswordModal
                    isOpen={showPasswordModal}
                    onSuccess={handlePasswordUpdateSuccess}
                />

                <div>
                    <MapWrapper>
                        <MapContainer
                            center={defaultPosition}
                            zoom={7}
                            scrollWheelZoom={true}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapResizer />

                            <MarkerClusterGroup>
                                {fireData.map((fire, index) => (
                                    <Marker
                                        key={`fire-${index}`}
                                        position={[fire.lat, fire.lng]}
                                        icon={obtenerIconoPorConfianza(fire.confidence)}
                                    >
                                        <Popup>
                                            <strong>Punto de calor detectado</strong><br />
                                            Fecha: {new Date(fire.date).toLocaleString()}<br />
                                            Confianza: {fire.confidence}
                                        </Popup>
                                    </Marker>
                                ))}
                            </MarkerClusterGroup>

                            {filteredBiomasas.map((biomasa, index) => (
                                <Polygon
                                    key={index}
                                    positions={biomasa.coordenadas}
                                    color={tipoBiomasaColors[biomasa.tipoBiomasa] || colors.primary}
                                    fillColor={tipoBiomasaColors[biomasa.tipoBiomasa] || colors.lightPrimary}
                                    fillOpacity={0.6}
                                    weight={2}
                                >
                                    <Popup>
                                        <strong>{biomasa.tipoBiomasa?.charAt(0).toUpperCase() + biomasa.tipoBiomasa?.slice(1)}</strong><br />
                                        <strong>Conservación:</strong> {biomasa.estadoConservacion?.charAt(0).toUpperCase() + biomasa.estadoConservacion?.slice(1)}<br />
                                        <strong>Densidad:</strong> {biomasa.densidad?.charAt(0).toUpperCase() + biomasa.densidad?.slice(1)}<br />
                                        <strong>Área:</strong> {biomasa.area} km²<br />
                                        <strong>Fecha:</strong> {biomasa.fecha}<br />
                                        <strong>Observaciones:</strong> {biomasa.observaciones || "Ninguna"}
                                    </Popup>
                                </Polygon>
                            ))}
                        </MapContainer>
                    </MapWrapper>

                    <StatsGrid>
                        <StatBox label="Temperatura Actual" value={`${weatherData?.current_weather?.temperature?.toFixed(1) || '--'}°C`} color={colors.info} />
                        <StatBox label="Humedad" value={`${weatherData?.hourly?.relative_humidity_2m?.[0] || '--'}%`} color={colors.info} />
                        <StatBox label="Precipitación" value={`${weatherData?.hourly?.precipitation?.[0] || '0'} mm`} color={colors.info} />
                        <StatBox label="Puntos de calor" value={fireData.length} color={fireData.length > 0 ? colors.danger : colors.success} />
                        <StatBox label="Áreas de biomasa" value={filteredBiomasas.length} color={colors.success} />
                    </StatsGrid>

                    <FireList fires={fireData} />
                </div>

                <SidebarContainer>
                    <BiomasaList
                        biomasas={biomasaData}
                        onDelete={handleDeleteBiomasa}
                        onFiltered={handleFilteredBiomasas}
                    />
                </SidebarContainer>
            </MainContainer>
        </div>
    );
};

export default Dashboard;