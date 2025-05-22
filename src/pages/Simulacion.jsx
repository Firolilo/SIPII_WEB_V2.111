import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Polygon, useMapEvents } from "react-leaflet";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import Card from "../components/Card";
import StatBox from "../components/StatBox";
import RangeInput from "../components/RangeInput";
import { colors, sizes } from "../styles/theme";
import {gql, useMutation, useQuery} from "@apollo/client";


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
const UPDATE_NAME = gql`
  mutation UpdateName($id: ID!, $name: String!) {
    updateFireRiskName(id: $id, name: $name) {
      id
      name
    }
  }
`;

const SAVE_SIMULATION = gql`
  mutation SaveSimulation($input: SimulationInput!) {
    saveSimulation(input: $input) {
      id
      timestamp
      volunteerName 
    }
  }
`;

const GET_HISTORICAL_DATA = gql`
  query GetHistoricalData {
    getChiquitosFireRiskData(count: 10) {
      id
      timestamp
      duration
      name
      volunteers  
      location   
      fireRisk
      volunteerName  
      parameters { 
        temperature
        humidity
        windSpeed
        windDirection
        simulationSpeed
      }
       initialFires {       
        lat
        lng
        intensity
      }
    }
  }
`;
const DELETE_SIMULATION = gql`
  mutation DeleteSimulation($id: ID!) {
    deleteFireRiskData(id: $id)
  }
`;
const SIMULATION_CONFIG = {
    MAX_ACTIVE_FIRES: 50,
    MERGE_DISTANCE: 0.02,
    INACTIVITY_LIMIT: 5,
    MAX_HISTORY_POINTS: 10,
    VOLUNTEERS_PER_FIRE: 5,
    VOLUNTEERS_PER_INTENSITY: 2,
    VOLUNTEERS_PER_AREA: 0.1
};
const MapEvents = ({ addFire, simulationActive }) => {
    useMapEvents({
        click(e) {
            if (!simulationActive) {
                const { lat, lng } = e.latlng;
                addFire(lat, lng);
            }
        }
    });
    return null;
};

const getFireColor = (intensity) => {
    const heat = Math.min(255, Math.floor(intensity * 51));
    return `rgb(255, ${255 - heat}, 0)`;
};

const getWindDirectionLabel = (direction) => {
    const directions = ['Norte', 'Noreste', 'Este', 'Sureste', 'Sur', 'Suroeste', 'Oeste', 'Noroeste'];
    const index = Math.round((direction % 360) / 45) % 8;
    return directions[index];
};

const Simulacion = () => {
    const { user, logout } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();
    const mapRef = useRef();

    const [windDirection, setWindDirection] = useState(0);
    const [temperature, setTemperature] = useState(25);
    const [humidity, setHumidity] = useState(50);
    const [windSpeed, setWindSpeed] = useState(10);
    const [fireRisk, setFireRisk] = useState(0);
    const [fires, setFires] = useState([]);
    const [simulationActive, setSimulationActive] = useState(false);
    const [simulationSpeed, setSimulationSpeed] = useState(1);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [requiredVolunteers, setRequiredVolunteers] = useState(0);
    const [mitigationStrategies, setMitigationStrategies] = useState([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [isAutoStop, setIsAutoStop] = useState(false);
    const [initialFires, setInitialFires] = useState([]);
    const [saveSimulation] = useMutation(SAVE_SIMULATION);
    const [deleteSimulation] = useMutation(DELETE_SIMULATION);
    const [updateName] = useMutation(UPDATE_NAME);

    const { data: historicalData, refetch: refetchHistoricalData } = useQuery(GET_HISTORICAL_DATA);
    const [isRepeatedSimulation, setIsRepeatedSimulation] = useState(false);

    // Formatear datos históricos
    const formattedHistory = historicalData?.getChiquitosFireRiskData
        ?.map(item => ({
            id: item.id,
            fecha: new Date(item.timestamp).toLocaleDateString(),
            nombre: item.name || item.location,      // ← muestra location si name vacío
            tieneNombre: !!item.name,
            duracion: item.duration ? `${item.duration}h` : '—',
            duration: item.duration || 20,
            focos: item.initialFires?.length ?? 0,       // nuevo
            parameters: item.parameters,
            initialFires: item.initialFires
        })) || [];

    useEffect(() => {
        const tempFactor = Math.min(temperature / 40, 1);
        const humFactor = 1 - (humidity / 100);
        const windFactor = Math.min(windSpeed / 30, 1);
        const risk = Math.min(Math.round((tempFactor * 0.4 + humFactor * 0.3 + windFactor * 0.3) * 100), 100);
        setFireRisk(risk);
    }, [temperature, humidity, windSpeed]);

    const mergeCloseFires = (fireList) => {
        if (fireList.length <= 1) return fireList;

        const merged = [];
        const toMerge = [...fireList];

        while (toMerge.length > 0) {
            let current = toMerge.shift();
            let mergeCount = 1;

            for (let i = 0; i < toMerge.length; i++) {
                const distance = Math.sqrt(
                    Math.pow(toMerge[i].position[0] - current.position[0], 2) +
                    Math.pow(toMerge[i].position[1] - current.position[1], 2)
                );

                if (distance < SIMULATION_CONFIG.MERGE_DISTANCE) {
                    current = {
                        ...current,
                        position: [
                            (current.position[0] * mergeCount + toMerge[i].position[0]) / (mergeCount + 1),
                            (current.position[1] * mergeCount + toMerge[i].position[1]) / (mergeCount + 1)
                        ],
                        intensity: Math.max(current.intensity, toMerge[i].intensity),
                        spread: Math.max(current.spread, toMerge[i].spread),
                        history: [...current.history, ...toMerge[i].history]
                            .filter((v, i, a) => a.findIndex(t => t[0] === v[0] && t[1] === v[1]) === i)
                            .slice(-SIMULATION_CONFIG.MAX_HISTORY_POINTS)
                    };
                    mergeCount++;
                    toMerge.splice(i, 1);
                    i--;
                }
            }
            merged.push(current);
        }
        return merged;
    };
    const handleSave = async () => {
        try {
            // Verificar si hay focos de incendio iniciales
            if (initialFires.length === 0) {
                showNotification("Debes añadir al menos un foco de incendio", "error");
                return;
            }
            if (!user?.name) {
                showNotification("Error: No se pudo identificar al usuario", "error");
                return;
            }
            // Utilizar la posición del mapa o una posición por defecto
            const mapCenter = mapRef.current ? mapRef.current.getCenter() : { lat: -17.8, lng: -61.5 };

            // Preparar datos para la simulación
            const simulationData = {
                timestamp: new Date().toISOString(),
                location: "San José de Chiquitos",

                duration: timeElapsed,
                volunteers: requiredVolunteers,
                volunteerName: user.name,
                coordinates: {
                    lat: typeof mapCenter.lat === 'function' ? mapCenter.lat() : mapCenter.lat,
                    lng: typeof mapCenter.lng === 'function' ? mapCenter.lng() : mapCenter.lng
                },
                parameters: {
                    temperature: Number(temperature),
                    humidity: Number(humidity),
                    windSpeed: Number(windSpeed),
                    windDirection: Number(windDirection),
                    simulationSpeed: Number(simulationSpeed)
                },
                initialFires: initialFires.map(fire => ({
                    lat: fire.position[0],
                    lng: fire.position[1],
                    intensity: fire.intensity
                })),
                weather: {
                    temperature: Number(temperature),
                    humidity: Number(humidity),
                    windSpeed: Number(windSpeed),
                    windDirection: Number(windDirection)
                },
                fireRisk: Number(fireRisk),
                fireDetected: fires.length > 0
            };

            console.log("Enviando datos de simulación:", simulationData);
            console.table(simulationData);

            try {
                const { data, errors } = await saveSimulation({
                    variables: { input: simulationData }
                });

                if (errors && errors.length) {
                    console.error('❌ GraphQL Errors:', errors);
                    showNotification(`Error al guardar: ${errors[0].message}`, 'error');
                    return;
                }

                console.log('✅ Simulación guardada:', data.saveSimulation);
                showNotification('Simulación guardada exitosamente', 'success');
                setShowSaveModal(false);
                await refetchHistoricalData();
            } catch (error) {
                // Aquí solo caerás si es un NetworkError real
                console.error('🛑 Network / Apollo Error:', error);
                showNotification(`Error de red: ${error.message}`, 'error');
            }


            // Mostrar notificación de éxito
            showNotification("Simulación guardada exitosamente", "success");
            setShowSaveModal(false);

            // Actualizar datos históricos
            await refetchHistoricalData();
        } catch (error) {
            console.error("🛑 Error completo al guardar:", JSON.stringify(error, null, 2));

            const errorMessage =
                error?.graphQLErrors?.[0]?.message ||   // error del resolver
                error?.networkError?.message ||         // error de red genérico
                error.message ||                        // fallback
                "Error desconocido";

            showNotification(`Error al guardar: ${errorMessage}`, "error");
        }
    };
    const buildCurrentParameters = () => ({
        temperature,
        humidity,
        windSpeed,
        windDirection,
        simulationSpeed
    });

    const repeatSimulation = (parameters, initialFires, originalDuration) => {
        if (!parameters || !initialFires || !Array.isArray(initialFires)) {
            showNotification("No se pudo cargar esta simulación: datos incompletos", "error");
            return;
        }

        setTemperature(parameters.temperature);
        setHumidity(parameters.humidity);
        setWindSpeed(parameters.windSpeed);
        setWindDirection(parameters.windDirection);
        setSimulationSpeed(parameters.simulationSpeed);

        const newFires = initialFires.map(fire => ({
            id: Date.now() + Math.random(),
            position: [fire.lat, fire.lng],
            intensity: fire.intensity,
            spread: 0,
            direction: parameters.windDirection,
            history: [[fire.lat, fire.lng]],
            active: true
        }));

        setFires(newFires);
        setInitialFires(newFires);
        setIsRepeatedSimulation(true);
        setAutoStopDuration(originalDuration);
        setShowHistoryModal(false);
        setSimulationActive(true);
        showNotification("Simulación cargada - Iniciando...", "success");

    };
    const [autoStopDuration, setAutoStopDuration] = useState( 20);

    const addFire = (lat, lng) => {
        if (fires.length < SIMULATION_CONFIG.MAX_ACTIVE_FIRES * 2) {
            const newFire = {
                id: Date.now(),
                position: [lat, lng],
                intensity: 1,
                spread: 0,
                direction: windDirection,
                lastMovement: 0,
                active: true,
                history: [[lat, lng]]
            };
            setFires(prev => mergeCloseFires([...prev, newFire]));
            setInitialFires(prev => [...prev, newFire]);
        } else {
            showNotification("Límite de focos alcanzado", "warning");
        }
    };

    const toggleSimulation = () => {
        if (fires.length === 0 && !simulationActive) {
            showNotification("Añade focos de incendio haciendo clic en el mapa", "warning");
            return;
        }
        if (!simulationActive) {
            setTimeElapsed(0);
            setIsAutoStop(false);
            setAutoStopDuration(20);
        }
        setSimulationActive(!simulationActive);
    };

    const clearFires = () => {
        setFires([]);
        setInitialFires([]);
        setSimulationActive(false);
        setTimeElapsed(0);
        setIsAutoStop(false);
        setAutoStopDuration(20);
        showNotification("Simulación reiniciada", "info");
    };

    useEffect(() => {
        if (!simulationActive) return;

        const interval = setInterval(() => {
            setTimeElapsed(prev => {
                const newTime = prev + 1;
                if (newTime >= autoStopDuration) {
                    setIsAutoStop(true);
                    setSimulationActive(false);
                    setShowSaveModal(true);
                    return autoStopDuration;
                }
                return newTime;
            });

            setFires(prevFires => {
                let updatedFires = prevFires.filter(fire =>
                    (fire.lastMovement < SIMULATION_CONFIG.INACTIVITY_LIMIT && fire.active) ||
                    fire.intensity > 0.5
                );

                updatedFires.sort((a, b) => b.intensity - a.intensity);

                if (updatedFires.length > SIMULATION_CONFIG.MAX_ACTIVE_FIRES) {
                    updatedFires = updatedFires.slice(0, SIMULATION_CONFIG.MAX_ACTIVE_FIRES);
                }

                const newFires = updatedFires.flatMap(fire => {
                    if (fire.lastMovement >= SIMULATION_CONFIG.INACTIVITY_LIMIT) {
                        return [{ ...fire, active: false }];
                    }

                    const spreadRate = (fireRisk / 100) * (windSpeed / 20) * (temperature / 30) * (1 - (humidity / 150));
                    const spreadDistance = 0.01 * spreadRate * simulationSpeed;

                    if (spreadDistance < 0.001) {
                        return [{ ...fire, lastMovement: fire.lastMovement + 1 }];
                    }

                    const angleRad = (fire.direction * Math.PI) / 180;
                    const coneAngle = Math.PI / 4;

                    const newPoints = [
                        { angle: angleRad, distance: spreadDistance * (0.5 + Math.random() * 0.5) },
                        { angle: angleRad - coneAngle/2, distance: spreadDistance * (0.3 + Math.random() * 0.7) },
                        { angle: angleRad + coneAngle/2, distance: spreadDistance * (0.3 + Math.random() * 0.7) }
                    ].map(({angle, distance}) => ({
                        lat: fire.position[0] + Math.cos(angle) * distance,
                        lng: fire.position[1] + Math.sin(angle) * distance,
                        angleOffset: angle - angleRad
                    })).filter(({lat, lng}) => (
                        Math.abs(lat - fire.position[0]) > 0.0001 ||
                        Math.abs(lng - fire.position[1]) > 0.0001
                    ));

                    if (newPoints.length === 0) {
                        return [{ ...fire, lastMovement: fire.lastMovement + 1 }];
                    }

                    const availableSlots = Math.max(0, SIMULATION_CONFIG.MAX_ACTIVE_FIRES - updatedFires.length);
                    const firesToCreate = Math.min(newPoints.length, availableSlots);

                    return [
                        ...newPoints.slice(0, firesToCreate).map(({lat, lng, angleOffset}, i) => ({
                            id: `${fire.id}-${timeElapsed}-${i}`,
                            position: [lat, lng],
                            intensity: fire.intensity * (0.7 + Math.random() * 0.3),
                            spread: fire.spread + spreadDistance,
                            direction: fire.direction + (angleOffset * (180/Math.PI)) * 0.5,
                            lastMovement: 0,
                            active: true,
                            history: [...fire.history, [lat, lng]].slice(-SIMULATION_CONFIG.MAX_HISTORY_POINTS)
                        })),
                        { ...fire, active: false }
                    ];
                });

                return mergeCloseFires(newFires);
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [simulationActive, windDirection, windSpeed, temperature, humidity, simulationSpeed, fireRisk, timeElapsed,autoStopDuration]);

    useEffect(() => {
        if (!simulationActive && !isAutoStop && timeElapsed > 0) {
            if (isRepeatedSimulation) {
                setShowSaveModal(false);
                setShowHistoryModal(false);
                setIsRepeatedSimulation(true);
                setShowRepeatedEndModal(true);

            } else {
                setShowSaveModal(true);
            }
        }
    }, [simulationActive, isAutoStop, timeElapsed,isRepeatedSimulation]);
    const [showRepeatedEndModal, setShowRepeatedEndModal] = useState(false);

    useEffect(() => {
        const activeFires = fires.filter(f => f.active);
        let volunteers = 0;
        let totalIntensity = 0;
        let totalArea = 0;

        activeFires.forEach(fire => {
            const area = Math.PI * Math.pow(fire.spread * 100, 2) / 100;
            volunteers += SIMULATION_CONFIG.VOLUNTEERS_PER_FIRE +
                (fire.intensity * SIMULATION_CONFIG.VOLUNTEERS_PER_INTENSITY) +
                (area * SIMULATION_CONFIG.VOLUNTEERS_PER_AREA);
            totalIntensity += fire.intensity;
            totalArea += area;
        });

        setRequiredVolunteers(Math.round(volunteers));

        const strategies = [];
        if (activeFires.length === 0) {
            strategies.push("No hay incendios activos. Estado de vigilancia normal.");
        } else {
            if (activeFires.length > 5) {
                strategies.push("🔴 Activación de protocolo de emergencia mayor");
                strategies.push("🚒 Despliegue de bomberos profesionales");
            } else {
                strategies.push("🟡 Activación de protocolo de emergencia básico");
            }

            if (totalIntensity > 10) strategies.push("🚁 Uso de helicópteros para incendios de alta intensidad");
            if (totalArea > 50) strategies.push("🌊 Uso de camiones cisterna y cortafuegos");
            if (windSpeed > 30) strategies.push("⚠️ Precaución: Vientos fuertes pueden propagar incendios rápidamente");
            if (humidity < 30) strategies.push("💧 Considerar humectación de áreas circundantes");

            strategies.push(`👥 Se requieren aproximadamente ${Math.round(volunteers)} voluntarios`);
            strategies.push("📞 Contactar a defensa civil y autoridades locales");
        }

        setMitigationStrategies(strategies);
    }, [fires, fireRisk]);

    const chartData = {
        labels: ['Temperatura', 'Humedad', 'Viento'],
        datasets: [{
            label: 'Condiciones Actuales',
            data: [temperature, humidity, windSpeed],
            backgroundColor: [colors.danger, colors.info, colors.warning],
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
        }],
    };

    const position = [-17.8, -61.5];

    const handleRepeat = () => {
        setShowSaveModal(false);

        setTimeElapsed(0);
        setIsAutoStop(false);
        setAutoStopDuration(timeElapsed);
        // Usa repeatSimulation con los datos en memoria
        repeatSimulation(
            buildCurrentParameters(),
            initialFires.map(f => ({
                lat: f.position[0],
                lng: f.position[1],
                intensity: f.intensity
            })),
            autoStopDuration
        );
    };


    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            backgroundColor: colors.background
        }}>
            <NavBar user={user} onLogout={logout} />

            <main style={{
                flex: 1,
                padding: '20px',
                maxWidth: sizes.maxWidth,
                width: '100%',
                margin: '0 auto'
            }}>
                <h1 style={{
                    color: colors.primary,
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    Simulador Avanzado de Incendios
                </h1>

                <Card>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '10px',
                        marginBottom: '20px',
                        justifyContent: 'center'
                    }}>
                        <Button
                            onClick={toggleSimulation}
                            variant={simulationActive ? 'danger' : 'success'}
                        >
                            {simulationActive ? 'Detener Simulación' : 'Iniciar Simulación'}
                        </Button>
                        <Button
                            onClick={clearFires}
                            variant="outline"
                        >
                            Limpiar Todo
                        </Button>
                        <Button
                            onClick={() => setShowHistoryModal(true)}
                            variant="outline"
                        >
                            Ver Historial
                        </Button>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '15px',
                        justifyContent: 'center',
                        marginBottom: '20px'
                    }}>
                        <StatBox
                            label="Tiempo"
                            value={`${timeElapsed}h`}
                            color={colors.info}
                        />
                        <StatBox
                            label="Fuegos activos"
                            value={`${fires.filter(f => f.active).length}/${SIMULATION_CONFIG.MAX_ACTIVE_FIRES}`}
                            color={colors.warning}
                        />
                        <StatBox
                            label="Voluntarios necesarios"
                            value={requiredVolunteers}
                            color={colors.danger}
                        />
                    </div>

                    {mitigationStrategies.length > 0 && (
                        <div style={{
                            backgroundColor: colors.light,
                            padding: '15px',
                            borderRadius: sizes.borderRadius,
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ marginTop: 0, color: colors.primary }}>Estrategias de Mitigación Recomendadas:</h3>
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                {mitigationStrategies.map((strategy, index) => (
                                    <li key={index} style={{ marginBottom: '8px' }}>{strategy}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div style={{
                        height: '500px',
                        borderRadius: sizes.borderRadius,
                        overflow: 'hidden',
                        marginBottom: '20px',
                        boxShadow: sizes.boxShadow
                    }}>
                        <MapContainer
                            center={position}
                            zoom={9}
                            scrollWheelZoom={true}
                            style={{ height: '100%', width: '100%' }}
                            ref={mapRef}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; OpenStreetMap contributors'
                            />
                            <MapEvents addFire={addFire} simulationActive={simulationActive} />

                            {fires.filter(f => f.active).map(fire => (
                                <React.Fragment key={`fire-${fire.id}`}>
                                    <Polygon
                                        positions={fire.history}
                                        color={getFireColor(fire.intensity)}
                                        fillColor={getFireColor(fire.intensity)}
                                        fillOpacity={0.4}
                                    />
                                    {fire.history.map((pos, i) => (
                                        <Polygon
                                            key={`fire-point-${fire.id}-${i}`}
                                            positions={[
                                                [pos[0] - 0.002, pos[1] - 0.002],
                                                [pos[0] + 0.002, pos[1] - 0.002],
                                                [pos[0] + 0.002, pos[1] + 0.002],
                                                [pos[0] - 0.002, pos[1] + 0.002]
                                            ]}
                                            color={getFireColor(fire.intensity)}
                                            fillColor={getFireColor(fire.intensity)}
                                            fillOpacity={0.7}
                                        />
                                    ))}
                                </React.Fragment>
                            ))}
                        </MapContainer>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                        gap: '20px',
                        marginBottom: '20px',
                        position: 'relative' // Asegúrate de que el contenedor no bloquee las interacciones
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '15px',
                            borderRadius: sizes.borderRadius,
                            boxShadow: sizes.boxShadow,
                            position: 'relative' // Esto asegura que los elementos dentro de este contenedor no afecten la interactividad
                        }}>
                            <h4 style={{ marginTop: 0, color: colors.primary }}>Dirección Viento</h4>
                            <RangeInput
                                min={0}
                                max={360}
                                value={windDirection}
                                onChange={(e) => setWindDirection(parseFloat(e.target.value))}
                                disabled={simulationActive}
                            />
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: '10px'
                            }}>
                                <div style={{
                                    transform: `rotate(${windDirection}deg)`,
                                    fontSize: '1.5rem',
                                    marginRight: '10px'
                                }}>↑</div>
                                <span>{getWindDirectionLabel(windDirection)}</span>
                            </div>
                        </div>

                        <RangeControl
                            label="Velocidad Viento (km/h)"
                            min={0}
                            max={100}
                            value={windSpeed}
                            onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
                            disabled={simulationActive}
                        />

                        <RangeControl
                            label="Temperatura (°C)"
                            min={0}
                            max={50}
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            disabled={simulationActive}
                        />

                        <RangeControl
                            label="Humedad (%)"
                            min={0}
                            max={100}
                            value={humidity}
                            onChange={(e) => setHumidity(parseFloat(e.target.value))}
                            disabled={simulationActive}
                        />

                        <RangeControl
                            label="Velocidad Simulación"
                            min={0.1}
                            max={5}
                            step={0.1}
                            value={simulationSpeed}
                            onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
                        />

                        <div style={{
                            backgroundColor: 'white',
                            padding: '15px',
                            borderRadius: sizes.borderRadius,
                            boxShadow: sizes.boxShadow,
                            position: 'relative' // Asegúrate de que este contenedor no bloquee las interacciones
                        }}>
                            <h4 style={{ marginTop: 0, color: colors.primary }}>Riesgo de Incendio</h4>
                            <p style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: fireRisk > 70 ? colors.danger : fireRisk > 40 ? colors.warning : colors.success,
                                textAlign: 'center',
                                margin: '10px 0'
                            }}>
                                {fireRisk}%
                            </p>
                            <div style={{
                                height: '10px',
                                backgroundColor: colors.light,
                                borderRadius: '5px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${fireRisk}%`,
                                    height: '100%',
                                    backgroundColor: fireRisk > 70 ? colors.danger : fireRisk > 40 ? colors.warning : colors.success
                                }} />
                            </div>
                        </div>
                    </div>


                    <div style={{
                        height: '300px',
                        backgroundColor: 'white',
                        padding: '15px',
                        borderRadius: sizes.borderRadius,
                        boxShadow: sizes.boxShadow
                    }}>
                        <Bar
                            data={chartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        labels: {
                                            color: colors.text
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: { color: colors.text },
                                        grid: { color: `${colors.text}20` }
                                    },
                                    x: {
                                        ticks: { color: colors.text }
                                    }
                                }
                            }}
                        />
                    </div>
                </Card>
            </main>
            {showRepeatedEndModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: sizes.borderRadius,
                        boxShadow: sizes.boxShadow,
                        minWidth: '400px',
                        textAlign: 'center'
                    }}>
                        <h3 style={{
                            marginTop: 0,
                            color: colors.danger,
                            fontSize: '1.5rem'
                        }}>
                            🏁 Simulación Terminada
                        </h3>

                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'center',
                            marginTop: '1.5rem'
                        }}>
                            <Button
                                onClick={() => {
                                    handleRepeat();
                                    setShowRepeatedEndModal(false);
                                }}
                                style={{
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    padding: '10px 20px'
                                }}
                            >
                                🔄 Repetir
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowRepeatedEndModal(false);
                                    clearFires();
                                }}
                                style={{
                                    borderColor: colors.danger,
                                    color: colors.danger,
                                    padding: '10px 20px'
                                }}
                            >
                                🚪 Salir
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de Guardar Simulación */}
            {showSaveModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: sizes.borderRadius,
                        boxShadow: sizes.boxShadow,
                        minWidth: '400px',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ marginTop: 0, color: colors.primary }}>
                            {timeElapsed >= autoStopDuration ? "Simulación completada" : "Simulación detenida"}
                        </h3>
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'space-between',
                            marginTop: '1.5rem'
                        }}>
                            <Button
                                variant="outline"
                                onClick={() => setShowSaveModal(false)}
                            >
                                Cancelar
                            </Button>
                            <div style={{display: 'flex', gap: '1rem'}}>
                                <Button onClick={handleSave}>
                                    Guardar
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        handleRepeat();
                                        setShowSaveModal(false);
                                    }}
                                >
                                    Repetir
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de Historial */}
            {showHistoryModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: sizes.borderRadius,
                        boxShadow: sizes.boxShadow,
                        minWidth: '800px',
                        maxWidth: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}>
                        <h3
                            style={{
                                marginTop: 0,
                                color: colors.primary,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            Historial de Simulaciones
                        </h3>

                        <div style={{margin: '1.5rem 0'}}>
                            <table
                                style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    textAlign: 'left'
                                }}
                            >
                                <thead>
                                <tr style={{borderBottom: `2px solid ${colors.light}`}}>
                                    <th style={{padding: '8px'}}>Fecha</th>
                                    <th style={{padding: '8px'}}>Nombre</th>
                                    <th style={{padding: '8px'}}>Duración</th>
                                    <th style={{padding: '8px'}}>Focos</th>
                                    <th style={{padding: '8px'}}>Voluntario</th>

                                    <th style={{padding: '8px'}}>Acción</th>
                                </tr>
                                </thead>

                                <tbody>
                                {formattedHistory.map((item) => (
                                    <tr
                                        key={item.id}
                                        style={{
                                            borderBottom: `1px solid ${colors.light}`,
                                            ':hover': {backgroundColor: `${colors.light}20`}
                                        }}
                                    >
                                        {/* FECHA */}
                                        <td style={{padding: '8px'}}>{item.fecha}</td>

                                        {/* NOMBRE + botón Asignar / Editar (solo ADMIN) */}
                                        <td style={{padding: '8px'}}>
                                            {item.nombre}
                                            {user?.role === 'admin' && (
                                                <Button
                                                    variant="outline"
                                                    style={{marginLeft: 8, padding: '2px 6px'}}
                                                    onClick={async () => {
                                                        const nuevo = prompt(
                                                            'Nombre de la simulación:',
                                                            item.nombre
                                                        );
                                                        if (!nuevo || nuevo === item.nombre) return;
                                                        try {
                                                            await updateName({
                                                                variables: {id: item.id, name: nuevo}
                                                            });
                                                            await refetchHistoricalData();
                                                            showNotification('Nombre actualizado', 'success');
                                                        } catch {
                                                            showNotification('Error al actualizar nombre', 'error');
                                                        }
                                                    }}
                                                >
                                                    {item.tieneNombre ? 'Editar' : 'Asignar'}
                                                </Button>
                                            )}
                                        </td>

                                        {/* DURACIÓN y FOCOS */}
                                        <td style={{padding: '8px'}}>{item.duracion}</td>
                                        <td style={{padding: '8px'}}>{item.focos}</td>
                                        <td style={{padding: '8px'}}>{item.volunteerName}</td>

                                        {/* ACCIÓN: Repetir / Eliminar */}
                                        <td style={{padding: '8px'}}>
                                            <Button
                                                variant="text"
                                                onClick={() => {
                                                    repeatSimulation(item.parameters, item.initialFires, item.duration);
                                                    setShowHistoryModal(false);
                                                }}
                                                style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: '#4CAF50', // Verde vibrante
                                                    color: 'white',
                                                    borderRadius: '8px',
                                                    fontWeight: '600',
                                                    transition: 'all 0.3s',
                                                    ':hover': {
                                                        backgroundColor: '#45a049',
                                                        transform: 'scale(1.05)'
                                                    }
                                                }}
                                            > >
                                                Repetir
                                            </Button>

                                            {user?.role === 'admin' && (
                                                <Button
                                                    variant="danger"
                                                    style={{
                                                        marginLeft: '8px',
                                                        padding: '6px 12px',
                                                        backgroundColor: '#ff4444', // Rojo intenso
                                                        color: 'white',
                                                        borderRadius: '8px',
                                                        fontWeight: '600',
                                                        transition: 'all 0.3s',
                                                        ':hover': {
                                                            backgroundColor: '#cc0000',
                                                            transform: 'scale(1.05)'
                                                        }
                                                    }}
                                                    onClick={async () => {
                                                        if (!window.confirm('¿Eliminar esta simulación?')) return;
                                                        try {
                                                            await deleteSimulation({variables: {id: item.id}});
                                                            await refetchHistoricalData();
                                                            showNotification('Simulación eliminada', 'success');
                                                        } catch {
                                                            showNotification('Error al eliminar', 'error');
                                                        }
                                                    }}
                                                >
                                                    Eliminar
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                gap: '1rem',
                                justifyContent: 'flex-end',
                                marginTop: '1.5rem'
                            }}
                        >
                            <Button variant="outline" onClick={() => setShowHistoryModal(false)}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const RangeControl = ({label, value, onChange, min, max, step = 1, disabled = false}) => (
    <div style={{
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: sizes.borderRadius,
        boxShadow: sizes.boxShadow
    }}>
        <h4 style={{marginTop: 0, color: colors.primary}}>{label}</h4>
        <RangeInput
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            disabled={disabled}
        />
        <p style={{
            textAlign: 'center',
            fontSize: '1.2rem',
            margin: '10px 0 0',
            fontWeight: 'bold',
            color: colors.text
        }}>
            {value}
        </p>
    </div>
);

export default Simulacion;