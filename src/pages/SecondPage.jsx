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
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import NavBar from '../components/NavBar';
import StatBox from '../components/StatBox';
import Loading from '../components/Loading';
import { getWeatherData } from "../services/weatherAPI";
import { colors, sizes } from '../styles/theme';
import Card from '../components/Card';

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
                const currentWeather = await getWeatherData(-17.8, -63.2);
                const historicalWeather = await getWeatherData(-17.8, -63.2, '2024-01-01', '2024-01-07');
                setCurrent(currentWeather.current_weather);
                setHistory(historicalWeather.hourly);
            } catch (err) {
                setError(err);
                showNotification("Error al cargar datos climáticos", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <Loading />;
    if (error || !current || !history) return <p>Error cargando datos del clima</p>;

    const chartData = {
        labels: ['Temperatura', 'Humedad', 'Precipitación'],
        datasets: [{
            label: 'Condiciones Actuales',
            data: [
                current.temperature,
                history.relative_humidity_2m?.[0] ?? 0,
                history.precipitation?.[0] ?? 0
            ],
            backgroundColor: [colors.warning, colors.warning, colors.info],
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1
        }]
    };

    const lineChartOptions = (title) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: title,
                font: { size: 18, weight: 'bold' },
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

    const formattedLabels = history.time.map(t => {
        const date = new Date(t);
        return date.toLocaleString('es-BO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', '');
    });

    const tempChartData = {
        labels: formattedLabels,
        datasets: [{
            label: 'Temperatura (°C)',
            data: history.temperature_2m,
            fill: false,
            borderColor: colors.warning,
            tension: 0.4
        }]
    };

    const humidityChartData = {
        labels: formattedLabels,
        datasets: [{
            label: 'Humedad (%)',
            data: history.relative_humidity_2m,
            fill: false,
            borderColor: colors.info,
            tension: 0.4
        }]
    };

    const precipitationChartData = {
        labels: formattedLabels,
        datasets: [{
            label: 'Precipitación (mm)',
            data: history.precipitation,
            fill: true,
            backgroundColor: `${colors.primary}33`,
            borderColor: colors.primary,
            tension: 0.4
        }]
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
                    marginBottom: '30px',
                    textAlign: 'center'
                }}>
                    Visualización de Datos Climáticos
                </h1>

                <Card>
                    {/* Estadísticas actuales */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: '15px',
                        marginBottom: '30px'
                    }}>
                        <StatBox label="Temperatura" value={`${current.temperature.toFixed(1)}°C`} color={colors.warning} />
                        <StatBox label="Humedad" value={`${history.relative_humidity_2m[0]}%`} color={colors.warning} />
                        <StatBox label="Precipitación" value={`${history.precipitation[0]} mm`} color={colors.info} />
                        <StatBox label="Viento" value={`${current.windspeed} km/h`} color={colors.info} />
                    </div>

                    {/* Gráfico de condiciones actuales */}
                    <div style={{
                        height: '300px',
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: sizes.borderRadius,
                        boxShadow: sizes.boxShadow,
                        marginBottom: '30px'
                    }}>
                        <Bar data={chartData} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    labels: {
                                        color: colors.text,
                                        font: { weight: 'bold' }
                                    }
                                },
                                tooltip: {
                                    backgroundColor: colors.primary,
                                    titleColor: 'white',
                                    bodyColor: 'white'
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: { color: colors.text },
                                    grid: { color: `${colors.text}10` }
                                },
                                x: {
                                    ticks: {
                                        color: colors.text,
                                        font: { weight: 'bold' }
                                    }
                                }
                            }
                        }} />
                    </div>

                    {/* Gráficos históricos */}
                    <div style={{ marginBottom: '30px' }}>
                        <div style={{
                            height: '300px',
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: sizes.borderRadius,
                            boxShadow: sizes.boxShadow,
                            marginBottom: '20px'
                        }}>
                            <Line data={tempChartData} options={lineChartOptions("Temperatura Semanal")} />
                        </div>

                        <div style={{
                            height: '300px',
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: sizes.borderRadius,
                            boxShadow: sizes.boxShadow,
                            marginBottom: '20px'
                        }}>
                            <Line data={humidityChartData} options={lineChartOptions("Humedad Relativa Semanal")} />
                        </div>

                        <div style={{
                            height: '300px',
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: sizes.borderRadius,
                            boxShadow: sizes.boxShadow
                        }}>
                            <Line data={precipitationChartData} options={lineChartOptions("Precipitación Semanal")} />
                        </div>
                    </div>
                </Card>
            </main>
        </div>
    );
};

export default Datos;
