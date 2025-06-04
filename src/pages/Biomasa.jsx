import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { useAuth } from "../context/AuthContext";
import styled from 'styled-components';

// Estilos para el fondo blureado
const backdropStyles = {
    backgroundImage: "url('https://i.imgur.com/EdNjdpM_d.webp?maxwidth=1520&fidelity=grand')",
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

// Componentes estilizados
const BiomasaContainer = styled.div`
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  width: 100%;
  margin: 20px auto;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
`;

const BiomasaHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
`;

const BiomasaTitle = styled.h1`
  color: #2e7d32;
  font-size: 2rem;
  margin-bottom: 10px;
`;

const BiomasaSubtitle = styled.p`
  color: #555;
  font-size: 1.1rem;
  margin-bottom: 20px;
`;

const BiomasaForm = styled.form`
  background-color: rgba(255, 255, 255, 0.8);
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const SectionTitle = styled.h2`
  color: #2e7d32;
  margin-top: 25px;
  margin-bottom: 15px;
  font-size: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: rgba(255, 255, 255, 0.9);
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 100px;
  background-color: rgba(255, 255, 255, 0.9);
`;

const MapContainerStyled = styled.div`
  height: 400px;
  width: 100%;
  margin-bottom: 15px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const MapInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  font-size: 0.9rem;
  color: #555;
`;

const ResetButton = styled.button`
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;

  &:hover {
    background-color: #d32f2f;
  }
`;

const SubmitButton = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.3s;
  width: 100%;
  margin-top: 20px;

  &:hover {
    background-color: #388e3c;
  }
`;

const FooterMessage = styled.div`
  text-align: center;
  margin-top: 30px;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  color: #555;
`;

// Configuración de íconos
const biomassIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41]
});

function MapClickHandler({ onClick }) {
    const map = useMapEvents({
        click(e) {
            onClick(e);
        }
    });
    return null;
}

export default function ReporteBiomasa() {
    const { user, logout } = useAuth();
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
    const centerPosition = [-17.8, -61.5];

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
        const polygon = turf.polygon([[...points, points[0]]]);
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

        const existing = JSON.parse(localStorage.getItem("biomasaReportes") || "[]");
        localStorage.setItem("biomasaReportes", JSON.stringify([...existing, finalData]));

        alert('¡Reporte de biomasa enviado con éxito!');
        navigate('/Inicio');
    };

    return (
        <div style={containerStyles}>
            {/* Capas de fondo */}
            <div style={backdropStyles} />
            <div style={overlayStyles} />

            <NavBar user={user} onLogout={logout} />

            <BiomasaContainer>
                <BiomasaHeader>
                    <BiomasaTitle>Reporte de Zonas de Biomasa - Chiquitanía</BiomasaTitle>
                    <BiomasaSubtitle>Ayuda a monitorear y conservar los recursos naturales</BiomasaSubtitle>
                </BiomasaHeader>

                <BiomasaForm onSubmit={handleSubmit}>
                    <SectionTitle>Información básica</SectionTitle>

                    <FormGroup>
                        <FormLabel htmlFor="fecha">Fecha de observación</FormLabel>
                        <FormInput
                            type="date"
                            id="fecha"
                            name="fecha"
                            value={formData.fecha}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <FormLabel htmlFor="tipoBiomasa">Tipo de biomasa</FormLabel>
                        <FormInput as="select"
                                   id="tipoBiomasa"
                                   name="tipoBiomasa"
                                   value={formData.tipoBiomasa}
                                   onChange={handleChange}
                                   required
                        >
                            <option value="bosque">Bosque</option>
                            <option value="sabana">Sabana</option>
                            <option value="humedal">Humedal</option>
                            <option value="pastizal">Pastizal</option>
                            <option value="arbustivo">Matorral arbustivo</option>
                        </FormInput>
                    </FormGroup>

                    <FormGroup>
                        <FormLabel htmlFor="estadoConservacion">Estado de conservación</FormLabel>
                        <FormInput as="select"
                                   id="estadoConservacion"
                                   name="estadoConservacion"
                                   value={formData.estadoConservacion}
                                   onChange={handleChange}
                                   required
                        >
                            <option value="excelente">Excelente (sin perturbación)</option>
                            <option value="bueno">Bueno (ligera perturbación)</option>
                            <option value="regular">Regular (perturbación moderada)</option>
                            <option value="degradado">Degradado (alta perturbación)</option>
                        </FormInput>
                    </FormGroup>

                    <FormGroup>
                        <FormLabel htmlFor="densidad">Densidad de vegetación</FormLabel>
                        <FormInput as="select"
                                   id="densidad"
                                   name="densidad"
                                   value={formData.densidad}
                                   onChange={handleChange}
                                   required
                        >
                            <option value="baja">Baja (0-30% cobertura)</option>
                            <option value="media">Media (30-70% cobertura)</option>
                            <option value="alta">Alta (70-100% cobertura)</option>
                        </FormInput>
                    </FormGroup>

                    <SectionTitle>Delimitación del área</SectionTitle>

                    <FormGroup>
                        <FormLabel>
                            Haz clic en el mapa para marcar los límites del área
                            <span style={{fontSize: '0.9rem', color: '#666'}}> (Mínimo 3 puntos)</span>
                        </FormLabel>

                        <MapContainerStyled>
                            <MapContainer
                                center={centerPosition}
                                zoom={9}
                                style={{ height: '100%', width: '100%' }}
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
                        </MapContainerStyled>

                        <MapInfo>
                            <div>
                                <p>Puntos marcados: {polygonPoints.length}</p>
                                {polygonPoints.length > 2 && (
                                    <p>Área aproximada: {calculateArea(polygonPoints)} km²</p>
                                )}
                            </div>
                            {polygonPoints.length > 0 && (
                                <ResetButton
                                    type="button"
                                    onClick={handleResetPolygon}
                                >
                                    Reiniciar delimitación
                                </ResetButton>
                            )}
                        </MapInfo>
                    </FormGroup>

                    <FormGroup>
                        <FormLabel htmlFor="observaciones">Observaciones</FormLabel>
                        <FormTextarea
                            id="observaciones"
                            name="observaciones"
                            rows={4}
                            value={formData.observaciones}
                            onChange={handleChange}
                            placeholder="Describe características relevantes de la biomasa observada..."
                        />
                    </FormGroup>

                    <SubmitButton type="submit">
                        Enviar Reporte de Biomasa
                    </SubmitButton>
                </BiomasaForm>

                <FooterMessage>
                    <p>¡Gracias por contribuir al monitoreo de los recursos naturales de la Chiquitanía!</p>
                    <p>Tu reporte ayuda en la conservación y manejo sostenible de la biomasa regional.</p>
                </FooterMessage>
            </BiomasaContainer>
        </div>
    );
}