import axios from 'axios';

export const getFireData = async () => {
    try {
        const response = await axios.get('http://localhost:4001/api/fires');

        const fires = parseCsv(response.data);

        return fires;
    } catch (error) {
        console.error('Error fetching internal fire data:', error);
        throw error;
    }
};

function parseCsv(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',');

    const fires = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i] || lines[i].trim() === '') continue;

        const data = lines[i].split(',');

        // Verifica que haya suficientes columnas
        if (data.length < 4) continue;

        const lat = parseFloat(data[1]);
        const lng = parseFloat(data[2]);

        // Solo añade si las coordenadas son válidas
        if (!isNaN(lat) && !isNaN(lng)) {
            fires.push({
                lat: lat,
                lng: lng,
                date: data[6] || 'Fecha desconocida',
                confidence: data[10]

            });
        } else {
            console.warn('Coordenadas inválidas en línea:', i, data);
        }
    }
    return fires;
}