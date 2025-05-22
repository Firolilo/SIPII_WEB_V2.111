import { useState } from 'react';
import {MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/Biomasa.css';
import * as turf from '@turf/turf';
import { useNavigate } from "react-router-dom";


function MapClickHandler({ onClick }) {
    const map = useMapEvents({
        click(e) {
            onClick(e);
        }
    });
    return null;
}

// Configuración de íconos
const biomassIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41]
});

export default function ReporteBiomasa() {


    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fecha: '',
        tipoBiomasa: 'bosque',
        estadoConservacion: 'bueno',
        area: '',
        densidad: 'media',
        observaciones: ''
    });

    const [markerPosition, setMarkerPosition] = useState(null);
    const [polygonPoints, setPolygonPoints] = useState([]);
    const centerPosition = [-17.8, -61.5]; // Centro de Chiquitos

    const handleMapClick = (e) => {
        const { lat, lng } = e.latlng;

        if (polygonPoints.length < 10) {
            const newPoints = [...polygonPoints, [lat, lng]];
            setPolygonPoints(newPoints);
            setMarkerPosition([lat, lng]);

            setFormData(prev => ({
                ...prev,
                ubicacion: {
                    lat: lat.toFixed(6),
                    lng: lng.toFixed(6),
                    polygon: newPoints
                },
                area: calculateArea(newPoints)
            }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleResetPolygon = () => {
        setPolygonPoints([]);
        setMarkerPosition(null);
    };

    const calculateArea = (points) => {
        if (points.length < 3) return 0;

        // Convertir los puntos en un polígono GeoJSON válido
        const polygon = turf.polygon([[...points, points[0]]]); // Cerramos el polígono

        // Calcular el área en metros cuadrados y convertir a km²
        const areaInSquareMeters = turf.area(polygon);
        const areaInKm2 = areaInSquareMeters / 1_000_000;

        return areaInKm2.toFixed(2);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (polygonPoints.length < 3) {
            alert('Por favor, marca al menos 3 puntos en el mapa para definir el área de biomasa');
            return;
        }

        const finalData = {
            ...formData,
            area: calculateArea(polygonPoints),
            coordenadas: polygonPoints
        };

        // Guarda el nuevo reporte en localStorage (pueden haber varios)
        const existing = JSON.parse(localStorage.getItem("biomasaReportes") || "[]");
        localStorage.setItem("biomasaReportes", JSON.stringify([...existing, finalData]));

        alert('¡Reporte de biomasa enviado con éxito!');
        navigate('/dashboard');
    };

    return (
        <div className="biomasa-container">
            <div className="biomasa-header">
                <h1 className="biomasa-title">Reporte de Zonas de Biomasa - Chiquitanía</h1>
                <p className="biomasa-subtitle">Ayuda a monitorear y conservar los recursos naturales</p>
                <div className="biomasa-icon-container">
                    <svg xmlns="http://www.w3.org/2000/svg" className="biomasa-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 13l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="biomasa-form">
                <h2 className="section-title">Información básica</h2>

                <div className="form-group">
                    <label htmlFor="fecha" className="form-label">Fecha de observación</label>
                    <input
                        type="date"
                        id="fecha"
                        name="fecha"
                        value={formData.fecha}
                        onChange={handleChange}
                        className="form-input"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="tipoBiomasa" className="form-label">Tipo de biomasa</label>
                    <select
                        id="tipoBiomasa"
                        name="tipoBiomasa"
                        value={formData.tipoBiomasa}
                        onChange={handleChange}
                        className="form-input"
                        required
                    >
                        <option value="bosque">Bosque</option>
                        <option value="sabana">Sabana</option>
                        <option value="humedal">Humedal</option>
                        <option value="pastizal">Pastizal</option>
                        <option value="arbustivo">Matorral arbustivo</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="estadoConservacion" className="form-label">Estado de conservación</label>
                    <select
                        id="estadoConservacion"
                        name="estadoConservacion"
                        value={formData.estadoConservacion}
                        onChange={handleChange}
                        className="form-input"
                        required
                    >
                        <option value="excelente">Excelente (sin perturbación)</option>
                        <option value="bueno">Bueno (ligera perturbación)</option>
                        <option value="regular">Regular (perturbación moderada)</option>
                        <option value="degradado">Degradado (alta perturbación)</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="densidad" className="form-label">Densidad de vegetación</label>
                    <select
                        id="densidad"
                        name="densidad"
                        value={formData.densidad}
                        onChange={handleChange}
                        className="form-input"
                        required
                    >
                        <option value="baja">Baja (0-30% cobertura)</option>
                        <option value="media">Media (30-70% cobertura)</option>
                        <option value="alta">Alta (70-100% cobertura)</option>
                    </select>
                </div>

                <h2 className="section-title">Delimitación del área</h2>

                <div className="form-group">
                    <label className="form-label">
                        Haz clic en el mapa para marcar los límites del área
                        <span className="instruction-text"> (Mínimo 3 puntos)</span>
                    </label>

                    <div className="map-container">
                        <MapContainer
                            center={centerPosition}
                            zoom={9}
                            style={{ height: '100%', width: '100%' }}
                            onClick={handleMapClick}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <MapClickHandler onClick={handleMapClick} />

                            {markerPosition && (
                                <Marker position={markerPosition} icon={biomassIcon}>
                                    <Popup>Último punto marcado</Popup>
                                </Marker>
                            )}

                            {polygonPoints.length > 0 && (
                                <Polygon
                                    positions={polygonPoints}
                                    color="#4CAF50"
                                    fillColor="#81C784"
                                    fillOpacity={0.4}
                                />
                            )}
                        </MapContainer>
                    </div>

                    <div className="map-info">
                        <p>Puntos marcados: {polygonPoints.length}</p>
                        {polygonPoints.length > 2 && (
                            <p>Área aproximada: {calculateArea(polygonPoints)} km²</p>
                        )}
                        {polygonPoints.length > 0 && (
                            <button
                                type="button"
                                onClick={handleResetPolygon}
                                className="reset-button"
                            >
                                Reiniciar delimitación
                            </button>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="observaciones" className="form-label">Observaciones</label>
                    <textarea
                        id="observaciones"
                        name="observaciones"
                        rows={4}
                        value={formData.observaciones}
                        onChange={handleChange}
                        className="form-input form-textarea"
                        placeholder="Describe características relevantes de la biomasa observada..."
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="submit-button">
                        <svg xmlns="http://www.w3.org/2000/svg" className="submit-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Enviar Reporte de Biomasa
                    </button>
                </div>
            </form>

            <div className="footer-message">
                <p>¡Gracias por contribuir al monitoreo de los recursos naturales de la Chiquitanía!</p>
                <p>Tu reporte ayuda en la conservación y manejo sostenible de la biomasa regional.</p>
            </div>
        </div>
    );
}