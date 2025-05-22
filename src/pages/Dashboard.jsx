import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from '@apollo/client';
import { GET_DASHBOARD_DATA } from '../graphql/queries';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from "react-leaflet";
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import NavBar from '../components/NavBar';
import StatBox from '../components/StatBox';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/ErrorDisplay';
import {colors, tipoBiomasaColors} from '../styles/theme';
import { getWeatherData } from '../services/weatherAPI';
import { getFireData } from '../services/firmsAPI';
import BiomasaList from "../components/BiomasaList";
import FireList from '../components/FireList';


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

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { showNotification } = useNotification();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [biomasaData, setBiomasaData] = useState([]);
    const [filteredBiomasas, setFilteredBiomasas] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editForm, setEditForm] = useState({
        tipoBiomasa: '',
        estadoConservacion: '',
        densidad: '',
        area: '',
        fecha: '',
        observaciones: ''
    });
    const [selectedBiomasa, setSelectedBiomasa] = useState(null);

    // Cargar datos de biomasa desde localStorage
    useEffect(() => {
        const storedData = JSON.parse(localStorage.getItem("biomasaReportes") || "[]");
        setBiomasaData(storedData);
        setFilteredBiomasas(storedData); // Inicialmente, mostrar todas las biomasas
        document.title = "Dashboard - SIPII";

        // Forzar redimensionamiento del mapa después de cargar los datos
        const timer = setTimeout(() => {
            const mapElement = document.querySelector('.leaflet-container');
            if (mapElement && mapElement._leaflet_map) {
                mapElement._leaflet_map.invalidateSize();
            }
        }, 500);

        setLoading(false);

        return () => clearTimeout(timer);
    }, []);

    // Función para manejar el filtrado
    const handleFilteredBiomasas = (filtered) => {
        setFilteredBiomasas(filtered);
        console.log(filtered)
    };
    // Manejar eliminación de reporte de biomasa
    const handleDeleteBiomasa = (index) => {
        const newBiomasaData = biomasaData.filter((_, i) => i !== index);
        setBiomasaData(newBiomasaData);
        localStorage.setItem("biomasaReportes", JSON.stringify(newBiomasaData));
        showNotification("Reporte de biomasa eliminado", "success");
        if (selectedBiomasa === index) {
            setSelectedBiomasa(null);
        } else if (selectedBiomasa > index) {
            setSelectedBiomasa(selectedBiomasa - 1);
        }
    };

    // Manejar edición de reporte de biomasa
    const handleEditBiomasa = (index) => {
        setEditingIndex(index);
        setEditForm(biomasaData[index]);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
    };

    const handleSaveEdit = () => {
        const updatedData = [...biomasaData];
        updatedData[editingIndex] = editForm;
        setBiomasaData(updatedData);
        localStorage.setItem("biomasaReportes", JSON.stringify(updatedData));
        setEditingIndex(null);
        showNotification("Cambios guardados exitosamente", "success");
    };

    // Manejar selección de biomasa
    const handleSelectBiomasa = (biomasa) => {
        setSelectedBiomasa(biomasa.id === selectedBiomasa ? null : biomasa.id);
    };

    // Procesar datos de incendios
    const [weatherData, setWeatherData] = useState(null);
    const [fireData, setFireData] = useState([]);

    const defaultPosition = [-17.8, -61.5];

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
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: colors.background }}>
            <NavBar user={user} onLogout={logout} />

            <main style={{ flex: 1, padding: '20px', maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
                <div>
                    {/* Contenedor del Mapa */}
                    <div style={{ height: '500px', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', position: 'relative' }}>
                        <MapContainer
                            center={[-17.8, -61.5]}
                            zoom={7}
                            scrollWheelZoom={true}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapResizer />

                            {/* Marcadores de incendio */}
                            {fireData.map((fire, index) => (
                                <Marker key={`fire-${index}`} position={[fire.lat, fire.lng]} icon={obtenerIconoPorConfianza(fire.confidence)}>
                                <Popup>
                                        <strong>Punto de calor detectado</strong><br />
                                        Fecha: {new Date(fire.date).toLocaleString()}<br />
                                        Confianza: {fire.confidence}
                                    </Popup>
                                </Marker>
                            ))}

                            {/* Mostrar solo los polígonos filtrados de biomasa */}
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
                    </div>

                    {/* Otros componentes de estadísticas */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        <StatBox label="Temperatura Actual" value={`${weatherData?.current_weather?.temperature?.toFixed(1) || '--'}°C`} color={colors.info} />
                        <StatBox label="Humedad" value={`${weatherData?.hourly?.relative_humidity_2m?.[0] || '--'}%`} color={colors.info} />
                        <StatBox label="Precipitación" value={`${weatherData?.hourly?.precipitation?.[0] || '0'} mm`} color={colors.info} />
                        <StatBox label="Puntos de calor" value={fireData.length} color={fireData.length > 0 ? colors.danger : colors.success} />
                        <StatBox label="Áreas de biomasa" value={filteredBiomasas.length} color={colors.success} />
                    </div>

                    {/* Detalles de incendios */}
                    <FireList fires={fireData} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <BiomasaList
                        biomasas={biomasaData}
                        onDelete={handleDeleteBiomasa}
                        onFiltered={handleFilteredBiomasas}
                    />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;