import axios from 'axios';

let cachedWeather = null;
let lastWeatherFetchTime = 0;

export const getWeatherData = async (latitude, longitude, startDate = null, endDate = null) => {
    const now = Date.now();

    // Cache solo para datos actuales, no para históricos
    if (!startDate && !endDate && cachedWeather && (now - lastWeatherFetchTime) < 10 * 60 * 1000) {
        return cachedWeather;
    }

    try {
        let url = '';
        let params = {
            latitude,
            longitude,
            timezone: 'auto'
        };

        if (startDate && endDate) {
            // Datos históricos
            url = 'https://archive-api.open-meteo.com/v1/archive';
            params.start_date = startDate;
            params.end_date = endDate;
            params.hourly = 'temperature_2m,relative_humidity_2m,precipitation';
        } else {
            // Datos actuales y pronóstico
            url = 'https://api.open-meteo.com/v1/forecast';
            params.hourly = 'temperature_2m,relative_humidity_2m,precipitation';
            params.current_weather = true;
            params.daily = 'temperature_2m_max,temperature_2m_min';
        }

        const response = await axios.get(url, { params });

        // Cache solo datos actuales (sin rango)
        if (!startDate && !endDate) {
            cachedWeather = response.data;
            lastWeatherFetchTime = now;
        }

        return response.data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
};