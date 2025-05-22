import React, { useEffect, useState } from 'react';
import { getWeatherData } from '../services/weatherAPI';

const WeatherComponent = () => {
    const [weatherData, setWeatherData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getWeatherData(-17.8, -63.2, '2024-01-01', '2024-01-07');
                setWeatherData(data);
            } catch (error) {
                console.error('Error fetching weather data:', error);
            }
        };

        fetchData();
    }, []);

    if (!weatherData) return <div>Cargando datos climáticos...</div>;

    return (
        <div>
            <h2>Datos Históricos del Clima</h2>
            {/* Aquí puedes renderizar los datos como desees */}
            <pre>{JSON.stringify(weatherData, null, 2)}</pre>
        </div>
    );
};

export default WeatherComponent;
