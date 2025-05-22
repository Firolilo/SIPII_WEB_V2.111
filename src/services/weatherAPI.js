import axios from 'axios';

let cachedWeather = null;
let lastWeatherFetchTime = 0;

export const getWeatherData = async (latitude, longitude, startDate = null, endDate = null) => {
    const now = Date.now();
    if (cachedWeather && (now - lastWeatherFetchTime) < 10 * 60 * 1000 && !startDate && !endDate) {
        return cachedWeather; // usar cache por 10 minutos
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
            // Datos actuales
            url = 'https://api.open-meteo.com/v1/forecast';
            params.hourly = 'temperature_2m,relative_humidity_2m,precipitation';
            params.current_weather = true;
        }

        const response = await axios.get(url, { params });

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
