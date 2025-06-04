const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 4001;

const FIRMS_API_KEY = "cfc7d38ed62916315185b7a1853bdd8d";

app.use(cors());

let cachedData = null;
let lastFetchTime = 0;

app.get('/api/fires', async (req, res) => {
    const now = Date.now();
    if (cachedData && (now - lastFetchTime) < 10 * 60 * 1000) {
        return res.send(cachedData);
    }

    try {
        const url = `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${FIRMS_API_KEY}/VIIRS_NOAA20_NRT/BOL/1`;
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'SIPII-Client/1.0'
            }
        });
        cachedData = response.data;
        lastFetchTime = now;
        res.send(response.data);
    } catch (error) {
        console.error('Error interno:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error interno al obtener datos de FIRMS', details: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
