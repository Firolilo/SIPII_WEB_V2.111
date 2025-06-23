import * as XLSX from 'xlsx-js-style';


function getRiskInterpretation(risk) {
    if (risk >= 75) return 'Riesgo MUY ALTO - Acción inmediata requerida';
    if (risk >= 50) return 'Riesgo ALTO - Precaución extrema';
    if (risk >= 25) return 'Riesgo MODERADO - Monitoreo constante';
    return 'Riesgo BAJO - Vigilancia normal';
}


export const downloadSimulationAsExcel = (simulationData) => {
    if (!simulationData || typeof simulationData !== 'object') {
        console.error('Datos de simulación no válidos');
        return;
    }


    const wsData = [
        // Título
        ['INFORME DE SIMULACIÓN DE INCENDIOS'],
        [],

        // Información general
        ['Información General'],
        ['Fecha de generación', new Date().toLocaleString('es-ES')],
        ['Ubicación', simulationData.location || 'No especificado'],
        ['Responsable', simulationData.volunteerName || 'No especificado'],
        ['Duración (h)', simulationData.duration || 0],
        ['Riesgo (%)', simulationData.fireRisk || 0],
        ['Voluntarios necesarios', simulationData.volunteers || 0],
        [],

        // Parámetros Ambientales
        ['Parámetros Ambientales'],
        ['Temperatura (°C)', simulationData.parameters?.temperature ?? '—'],
        ['Humedad (%)', simulationData.parameters?.humidity ?? '—'],
        ['Viento (km/h)', simulationData.parameters?.windSpeed ?? '—'],
        ['Dirección Viento (°)', simulationData.parameters?.windDirection ?? '—'],
        ['Velocidad Simulación', simulationData.parameters?.simulationSpeed ?? '—'],
        [],

        // Evaluación de Riesgo
        ['Evaluación de Riesgo'],
        ['Riesgo (%)', simulationData.fireRisk || 0],
        ['Interpretación', getRiskInterpretation(simulationData.fireRisk || 0)],
        [],

        // Factores Clave
        ['Factores Clave'],
        ['# Focos iniciales', simulationData.initialFires?.length || 0],
        ['Temperatura >30 °C', (simulationData.parameters?.temperature ?? 0) > 30 ? 'Sí' : 'No'],
        ['Humedad <40 %', (simulationData.parameters?.humidity ?? 0) < 40 ? 'Sí' : 'No'],
        ['Viento >25 km/h', (simulationData.parameters?.windSpeed ?? 0) > 25 ? 'Sí' : 'No'],
        [],

        // Tabla de focos
        ['Ubicación de los Focos de Incendio'],
        ['#', 'Latitud', 'Longitud', 'Intensidad'],
    ];

    (simulationData.initialFires || []).forEach((f, i) => {
        wsData.push([i + 1, f.lat.toFixed(4), f.lng.toFixed(4), f.intensity]);
    });

    // Pie de página
    wsData.push([]);
    wsData.push(['Generado por el Sistema de Simulación', '', '', new Date().toLocaleString('es-ES')]);

    /* ---------------------------------------------------------------------
     * Crear hoja y aplicar estilos
     * -------------------------------------------------------------------*/
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Columnas anchas
    ws['!cols'] = [
        { wch: 30 },
        { wch: 22 },
        { wch: 22 },
        { wch: 18 },
    ];

    // Ayudas para detectar secciones
    const fireCount = simulationData.initialFires?.length || 0;
    const fireHeaderRow = wsData.length - fireCount - 3; // fila del encabezado (#, Lat, Lng...)
    const lastRow = wsData.length - 1;

    // Estilo base para TODAS las celdas (bordes finos típicos de Excel)
    const base = {
        border: {
            top:    { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left:   { style: 'thin', color: { rgb: '000000' } },
            right:  { style: 'thin', color: { rgb: '000000' } },
        },
        font: { name: 'Calibri', sz: 11 },
        alignment: { vertical: 'center', wrapText: true },
    };

    // Recorrer todas las celdas del rango existente
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = ws[cellAddress];
            if (!cell) continue;

            // Copia del estilo base
            let style = { ...base };

            /* ---------- Cabecera principal ---------- */
            if (R === 0) {
                style = {
                    ...style,
                    fill: { patternType: 'solid', fgColor: { rgb: '8B0000' } },
                    font: { name: 'Calibri', sz: 16, bold: true, color: { rgb: 'FFFFFF' } },
                    alignment: { ...style.alignment, horizontal: 'center' },
                };
            }

            /* ---------- Filas título de sección (una sola celda con texto) ---------- */
            else if (wsData[R] && wsData[R].length === 1) {
                style = {
                    ...style,
                    fill: { patternType: 'solid', fgColor: { rgb: 'F5B7B7' } },
                    font: { ...style.font, bold: true },
                };
            }

            /* ---------- Encabezado tabla focos ---------- */
            else if (R === fireHeaderRow) {
                style = {
                    ...style,
                    fill: { patternType: 'solid', fgColor: { rgb: 'CD5C5C' } },
                    font: { ...style.font, bold: true, color: { rgb: 'FFFFFF' } },
                    alignment: { ...style.alignment, horizontal: 'center' },
                };
            }

            /* ---------- Datos de la tabla de focos (banded rows) ---------- */
            else if (R > fireHeaderRow && R < lastRow) {
                const even = (R - fireHeaderRow) % 2 === 0;
                style = {
                    ...style,
                    fill: { patternType: 'solid', fgColor: { rgb: even ? 'FFFFFF' : 'FFF5F5' } },
                    alignment: { ...style.alignment, horizontal: 'center' },
                };
            }

            /* ---------- Pie de página ---------- */
            else if (R === lastRow) {
                style = {
                    ...style,
                    fill: { patternType: 'solid', fgColor: { rgb: 'D9D9D9' } },
                    font: { ...style.font, italic: true },
                    alignment: { ...style.alignment, horizontal: 'center' },
                };
            }

            // Aplicar el estilo final a la celda
            cell.s = style;
        }
    }

    /* Unir celdas para títulos y pie */
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // título
        { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
        { s: { r: 10, c: 0 }, e: { r: 10, c: 3 } },
        { s: { r: 17, c: 0 }, e: { r: 17, c: 3 } },
        { s: { r: 21, c: 0 }, e: { r: 21, c: 3 } },
        { s: { r: fireHeaderRow - 2, c: 0 }, e: { r: fireHeaderRow - 2, c: 3 } },
        { s: { r: lastRow, c: 0 }, e: { r: lastRow, c: 3 } },
    ];

    // Ajustar altura de la fila del título
    ws['!rows'] = wsData.map((row, idx) => {
        if (idx === 0) return { hpt: 30 };
        return {};
    });

    /* ---------------------------------------------------------------------
     * Guardar archivo
     * -------------------------------------------------------------------*/
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Simulación');

    const fileName = `Simulacion_${(simulationData.location || 'SinUbicacion').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
};