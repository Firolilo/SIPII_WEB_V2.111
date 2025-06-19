import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

const locationCache = {};

const getLocationName = async (lat, lng) => {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

    // Usar caché si existe
    if (locationCache[cacheKey]) {
        return locationCache[cacheKey];
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`
        );

        if (!response.ok) throw new Error('Error en la respuesta de Nominatim');

        const data = await response.json();

        // Extraer el nombre más significativo
        let locationName = cacheKey; // Valor por defecto

        if (data.address) {
            // Intentar obtener el nombre más específico posible
            locationName = data.address.road ||
                data.address.village ||
                data.address.town ||
                data.address.city ||
                data.address.county ||
                data.address.state ||
                data.display_name.split(",")[0];

            // Acortar nombres muy largos
            if (locationName.length > 50) {
                locationName = `${data.address.road ? data.address.road + ', ' : ''}${
                    data.address.village || data.address.town || data.address.city
                }`;
            }
        }

        // Guardar en caché
        locationCache[cacheKey] = locationName;
        return locationName;

    } catch (error) {
        console.error("Error en geocodificación:", error);
        return cacheKey; // Devolver las coordenadas como fallback
    }
};

/**
 * Genera un informe PDF con los datos de simulación
 * @param {Object} simulationData - Datos de la simulación
 */
export const generarInformePDF = async (simulationData) => {
    // Validación inicial del objeto de entrada
    if (!simulationData || typeof simulationData !== 'object') {
        console.error('Datos de simulación no válidos');
        return;
    }

    // Extracción de datos con valores por defecto
    const {
        location = 'Ubicación no especificada',
        timestamp = new Date().toISOString(),
        duration = 0,
        fireRisk = 0,
        parameters = {},
        initialFires = [],
        volunteers = 0,
        volunteerName = 'No especificado'
    } = simulationData;

    // Función de validación mejorada
    const getValidNumber = (value) => {
        if (value === null || value === undefined) return 0;
        const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
        return isNaN(num) ? 0 : num;
    };

    // Validar y formatear los datos
    const validData = {
        temperature: getValidNumber(parameters.temperature),
        humidity: getValidNumber(parameters.humidity),
        windSpeed: getValidNumber(parameters.windSpeed),
        windDirection: getValidNumber(parameters.windDirection),
        fireRisk: getValidNumber(fireRisk),
        simulationSpeed: getValidNumber(parameters.simulationSpeed)
    };

    // Validar initialFires
    const validatedFires = Array.isArray(initialFires)
        ? initialFires.map(fire => ({
            lat: getValidNumber(fire.lat),
            lng: getValidNumber(fire.lng),
            intensity: getValidNumber(fire.intensity)
        }))
        : [];

    // Obtener nombres de ubicaciones para todos los focos
    const firesWithLocationNames = await Promise.all(
        validatedFires.map(async (fire) => {
            const locationName = await getLocationName(fire.lat, fire.lng);
            return {
                ...fire,
                locationName
            };
        })
    );

    // Función para determinar el color según la intensidad
    const getIntensityColor = (intensity) => {
        if (intensity >= 3) return '#ff5252'; // Rojo para alta intensidad
        if (intensity >= 1.5) return '#ffab40'; // Naranja
        return '#ffd740'; // Amarillo para baja intensidad
    };

    // Definición del documento
    const docDefinition = {
        content: [
            {
                text: 'INFORME DE SIMULACIÓN DE INCENDIOS',
                style: 'header',
                margin: [0, 0, 0, 10]
            },
            {
                text: `Ubicación general: ${location}`,
                style: 'subheader',
                margin: [0, 0, 0, 5]
            },
            {
                columns: [
                    {
                        text: `Fecha: ${new Date(timestamp).toLocaleString('es-ES')}`,
                        width: '50%'
                    },
                    {
                        text: `Responsable: ${volunteerName}`,
                        width: '50%'
                    }
                ],
                margin: [0, 0, 0, 10]
            },
            {
                text: `Duración de la simulación: ${duration} horas`,
                margin: [0, 0, 0, 15]
            },
            {
                text: 'PARÁMETROS AMBIENTALES',
                style: 'sectionHeader',
            },
            {
                table: {
                    widths: ['*', '*'],
                    body: [
                        ['Temperatura (°C)', `${validData.temperature} °C`],
                        ['Humedad relativa', `${validData.humidity}%`],
                        ['Velocidad del viento', `${validData.windSpeed} km/h`],
                        ['Dirección del viento', `${validData.windDirection}° (${getWindDirectionName(validData.windDirection)})`],
                        ['Velocidad de simulación', validData.simulationSpeed]
                    ]
                },
                margin: [0, 5, 0, 15]
            },

            // Resumen de riesgo
            {
                text: 'EVALUACIÓN DE RIESGO',
                style: 'sectionHeader'
            },
            {
                stack: [
                    {
                        text: `Riesgo de incendio calculado: ${validData.fireRisk}%`,
                        style: 'riskLevel',
                        margin: [0, 0, 0, 5]
                    },
                    {
                        text: `Interpretación: ${getRiskInterpretation(validData.fireRisk)}`,
                        style: 'riskDescription',
                        margin: [0, 0, 0, 10]
                    },
                    {
                        text: 'Factores clave:',
                        style: 'listHeader',
                        margin: [0, 5, 0, 5]
                    },
                    {
                        ul: [
                            `Cantidad de focos iniciales: ${validatedFires.length}`,
                            `Voluntarios necesarios: ${volunteers}`,
                            `Temperatura elevada: ${validData.temperature > 30 ? 'Sí' : 'No'}`,
                            `Humedad baja: ${validData.humidity < 40 ? 'Sí' : 'No'}`,
                            `Vientos fuertes: ${validData.windSpeed > 25 ? 'Sí' : 'No'}`
                        ],
                        margin: [0, 0, 0, 15]
                    }
                ]
            },

            // Ubicación de focos
            {
                text: 'UBICACIÓN DE LOS FOCOS DE INCENDIO',
                style: 'sectionHeader',
                pageBreak: validatedFires.length > 8 ? 'before' : undefined
            },
            {
                table: {
                    widths: ['auto', '*', 'auto'],
                    headerRows: 1,
                    body: [
                        [
                            { text: '#', style: 'tableHeader' },
                            { text: 'Ubicación', style: 'tableHeader' },
                            { text: 'Intensidad', style: 'tableHeader' }
                        ],
                        ...firesWithLocationNames.map((f, i) => [
                            { text: i + 1, style: 'tableCell' },
                            {
                                text: f.locationName,
                                style: 'tableCell',
                                link: `https://www.openstreetmap.org/?mlat=${f.lat}&mlon=${f.lng}&zoom=15`,
                                color: '#1a73e8'
                            },
                            {
                                text: f.intensity,
                                style: 'tableCell',
                                fillColor: getIntensityColor(f.intensity),
                                alignment: 'center'
                            }
                        ])
                    ]
                },
                layout: {
                    fillColor: (rowIndex) => {
                        if (rowIndex === 0) return '#d32f2f'; // Rojo para encabezado
                        return (rowIndex % 2 === 0) ? '#f5f5f5' : null; // Filas alternas
                    }
                },
                margin: [0, 5, 0, 15]
            },
        ],
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                alignment: 'center',
                color: '#d32f2f'
            },
            subheader: {
                fontSize: 14,
                bold: true,
                color: '#333'
            },
            sectionHeader: {
                fontSize: 14,
                bold: true,
                color: '#d32f2f',
                margin: [0, 10, 0, 5]
            },
            riskLevel: {
                fontSize: 12,
                bold: true,
                color: '#333'
            },
            riskDescription: {
                fontSize: 11,
                color: '#555',
                italics: true
            },
            listHeader: {
                fontSize: 11,
                bold: true,
                color: '#333'
            },
            tableHeader: {
                bold: true,
                fontSize: 11,
                color: 'white',
                alignment: 'center'
            },
            tableCell: {
                fontSize: 10,
                margin: [5, 3, 5, 3]
            },
            footer: {
                fontSize: 8,
                color: '#666',
                alignment: 'center',
                margin: [0, 10, 0, 0]
            }
        },
        defaultStyle: {
            fontSize: 11,
        },
        footer: (currentPage, pageCount) => ({
            text: `Página ${currentPage} de ${pageCount} • Generado el ${new Date().toLocaleString('es-ES')}`,
            style: 'footer'
        }),
        pageMargins: [40, 60, 40, 60],
        pageSize: 'A4'
    };

    // Funciones auxiliares
    function getWindDirectionName(degrees) {
        const directions = ['Norte', 'Noreste', 'Este', 'Sureste', 'Sur', 'Suroeste', 'Oeste', 'Noroeste'];
        const index = Math.round((degrees % 360) / 45) % 8;
        return directions[index];
    }

    function getRiskInterpretation(risk) {
        if (risk >= 75) return 'Riesgo MUY ALTO - Acción inmediata requerida';
        if (risk >= 50) return 'Riesgo ALTO - Precaución extrema';
        if (risk >= 25) return 'Riesgo MODERADO - Monitoreo constante';
        return 'Riesgo BAJO - Vigilancia normal';
    }

    try {
        pdfMake.createPdf(docDefinition).download(
            `Informe_Incendios_${location.replace(/\s+/g, '_')}_${new Date(timestamp).toISOString().split('T')[0]}.pdf`
        );
    } catch (error) {
        console.error('Error al generar PDF:', error);
        throw new Error('Error al generar el informe PDF');
    }
};