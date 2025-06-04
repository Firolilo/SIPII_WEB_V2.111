import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";

import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import NavBar from "../components/NavBar";
import StatBox from "../components/StatBox";
import Loading from "../components/Loading";
import { getWeatherData } from "../services/weatherAPI";
import { colors, sizes } from "../styles/theme";
import Card from "../components/Card";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

const backdropStyles = {
    backgroundImage: "url('https://i.imgur.com/MEl7EI1.png')",
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
    height: "100vh",
    position: "relative",
    zIndex: 1,
    color: colors.text,
    backgroundColor: "transparent"
};

const mainGridStyles = {
    flexGrow: 1,
    padding: "20px",
    maxWidth: sizes.maxWidth,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridTemplateRows: "auto auto 1fr",
    gap: "20px",
    overflow: "hidden"
};

const cardBaseStyles = {
    padding: "20px",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    borderRadius: "8px",
    color: colors.text,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
};

const lineChartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        title: {
            display: true,
            text: title,
            font: { size: 18, weight: "bold" },
            color: colors.primary
        }
    },
    scales: {
        x: {
            ticks: { color: colors.text },
            grid: { color: `${colors.text}10` }
        },
        y: {
            ticks: { color: colors.text },
            grid: { color: `${colors.text}10` }
        }
    }
});

const Datos = () => {
    const { user, logout } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [current, setCurrent] = useState(null);
    const [history, setHistory] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Obtener datos actuales y pronóstico
                const weatherData = await getWeatherData(-17.8, -63.2);

                // Obtener datos históricos (últimos 7 días)
                const today = new Date();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(today.getDate() - 7);

                const historicalData = await getWeatherData(
                    -17.8,
                    -63.2,
                    sevenDaysAgo.toISOString().split('T')[0],
                    today.toISOString().split('T')[0]
                );

                setCurrent(weatherData.current_weather ?? null);
                setHistory(weatherData.hourly ?? null);

                console.log('Current weather:', weatherData.current_weather);
                console.log('Hourly data:', weatherData.hourly);
                console.log('Historical data:', historicalData.hourly);
            } catch (err) {
                setError(err);
                showNotification("Error al cargar datos climáticos", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [showNotification]);

    if (loading) return <Loading />;
    if (error) return <p>Error cargando datos del clima</p>;

    // Valores seguros para hoy
    const tempToday = current?.temperature ?? 0;
    const windspeedToday = current?.windspeed ?? 0;
    const humidityToday = history?.relative_humidity_2m?.[0] ?? 0;
    const precipitationToday = history?.precipitation?.[0] ?? 0;

    // Formatear etiquetas para gráficas
    const formattedLabels = history?.time?.map((t) => {
        const date = new Date(t);
        return date.toLocaleString("es-BO", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }).replace(",", "");
    }) || [];

    // Datos para gráficas
    const tempChartData = {
        labels: formattedLabels,
        datasets: [
            {
                label: "Temperatura (°C)",
                data: history?.temperature_2m || [],
                fill: false,
                borderColor: colors.warning,
                tension: 0.4
            }
        ]
    };

    const humidityChartData = {
        labels: formattedLabels,
        datasets: [
            {
                label: "Humedad (%)",
                data: history?.relative_humidity_2m || [],
                fill: false,
                borderColor: colors.info,
                tension: 0.4
            }
        ]
    };

    const precipitationChartData = {
        labels: formattedLabels,
        datasets: [
            {
                label: "Precipitación (mm)",
                data: history?.precipitation || [],
                fill: true,
                backgroundColor: `${colors.primary}33`,
                borderColor: colors.primary,
                tension: 0.4
            }
        ]
    };

    return (
        <div style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
            <div style={backdropStyles} />
            <div style={overlayStyles} />

            <div style={containerStyles}>
                <NavBar user={user} onLogout={logout} />

                <main style={mainGridStyles}>
                    {/* Datos Hoy: ocupa las 3 columnas */}
                    <Card
                        style={{
                            ...cardBaseStyles,
                            gridColumn: "1 / 4",
                            minHeight: "120px",
                            justifyContent: "center"
                        }}
                    >
                        <h2
                            style={{
                                margin: "0 0 15px 0",
                                fontWeight: 700,
                                fontSize: "1.5rem",
                                color: colors.primary,
                                textAlign: "center"
                            }}
                        >
                            Datos Hoy
                        </h2>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-around",
                                alignItems: "center",
                                flex: 1,
                                gap: "10px"
                            }}
                        >
                            <StatBox label="🌡 Temperatura" value={`${tempToday.toFixed(1)}°C`} color={colors.warning} />
                            <StatBox label="💧 Humedad" value={`${humidityToday}%`} color={colors.warning} />
                            <StatBox label="☔ Precipitación" value={`${precipitationToday} mm`} color={colors.info} />
                            <StatBox label="🌬 Viento" value={`${windspeedToday} km/h`} color={colors.info} />
                        </div>
                    </Card>

                    {/* Temperatura: toda la fila, altura flexible */}
                    <Card
                        style={{
                            ...cardBaseStyles,
                            gridColumn: "1 / 4",
                            minHeight: 0,
                            height: "25vh"
                        }}
                    >
                        <Line data={tempChartData} options={lineChartOptions("Temperatura Horaria")} />
                    </Card>

                    {/* Precipitación: columna 1 */}
                    <Card
                        style={{
                            ...cardBaseStyles,
                            gridColumn: "1 / 2",
                            minHeight: 0,
                            height: "20vh"
                        }}
                    >
                        <Line data={precipitationChartData} options={lineChartOptions("Precipitación Horaria")} />
                    </Card>

                    {/* Humedad: columnas 2 a 4 */}
                    <Card
                        style={{
                            ...cardBaseStyles,
                            gridColumn: "2 / 4",
                            minHeight: 0,
                            height: "20vh"
                        }}
                    >
                        <Line data={humidityChartData} options={lineChartOptions("Humedad Relativa Horaria")} />
                    </Card>
                </main>
            </div>
        </div>
    );
};

export default Datos;