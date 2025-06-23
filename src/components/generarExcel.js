import * as XLSX from 'xlsx';

export const downloadSimulationAsExcel = (simulationData) => {
    if (!simulationData || typeof simulationData !== 'object') {
        console.error('Datos de simulación no válidos');
        return;
    }

    const worksheetData = [
        ['INFORME DE SIMULACIÓN DE INCENDIOS'],
        [],
        ['Información General'],
        ['Fecha de generación', new Date().toLocaleString('es-ES')],
        ['Ubicación', simulationData.location || 'No especificado'],
        ['Responsable', simulationData.volunteerName || 'No especificado'],
        ['Duración de la simulación (horas)', simulationData.duration || 0],
        ['Riesgo de incendio calculado (%)', simulationData.fireRisk || 0],
        ['Voluntarios necesarios', simulationData.volunteers || 0],
        [],
        ['Parámetros Ambientales'],
        ['Temperatura (°C)', simulationData.parameters?.temperature || 0],
        ['Humedad relativa (%)', simulationData.parameters?.humidity || 0],
        ['Velocidad del viento (km/h)', simulationData.parameters?.windSpeed || 0],
        ['Dirección del viento (°)', simulationData.parameters?.windDirection || 0],
        ['Velocidad de simulación', simulationData.parameters?.simulationSpeed || 'No especificado'],
        [],
        ['Evaluación de Riesgo'],
        ['Riesgo de incendio calculado (%)', simulationData.fireRisk || 0],
        ['Interpretación', getRiskInterpretation(simulationData.fireRisk || 0)],
        [],
        ['Factores Clave'],
        ['# Focos iniciales', simulationData.initialFires?.length || 0],
        ['Voluntarios necesarios', simulationData.volunteers || 0],
        ['Temperatura elevada (>30°C)', (simulationData.parameters?.temperature || 0) > 30 ? 'Sí' : 'No'],
        ['Humedad baja (<40%)', (simulationData.parameters?.humidity || 0) < 40 ? 'Sí' : 'No'],
        ['Vientos fuertes (>25 km/h)', (simulationData.parameters?.windSpeed || 0) > 25 ? 'Sí' : 'No'],
        [],
        ['Ubicación de los Focos de Incendio'],
        ['#', 'Latitud', 'Longitud', 'Intensidad'],
    ];

    (simulationData.initialFires || []).forEach((fire, index) => {
        worksheetData.push([
            index + 1,
            (fire.lat || 0).toFixed(4),
            (fire.lng || 0).toFixed(4),
            fire.intensity || 0,
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wscols = [
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 20 },
    ];
    ws['!cols'] = wscols;

    const applyCellStyles = (cell, row, col) => {
        const baseStyle = {
            border: {
                top: { style: 'thin', color: { rgb: 'D3D3D3' } },
                right: { style: 'thin', color: { rgb: 'D3D3D3' } },
                bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
                left: { style: 'thin', color: { rgb: 'D3D3D3' } },
            },
            alignment: {
                horizontal: col === 0 ? 'left' : 'center',
                vertical: 'center',
                wrapText: true,
            },
            font: {
                name: 'Arial',
                sz: 10,
                color: { rgb: '000000' },
            },
        };

        if (row === 0) {
            return {
                ...baseStyle,
                fill: { patternType: 'solid', fgColor: { rgb: '8B0000' } },
                font: { name: 'Arial', sz: 16, bold: true, color: { rgb: 'FFFFFF' } },
                alignment: { horizontal: 'center', vertical: 'center' },
            };
        }

        if (worksheetData[row]?.length === 1 && worksheetData[row][0]) {
            return {
                ...baseStyle,
                fill: { patternType: 'solid', fgColor: { rgb: 'CD5C5C' } },
                font: { name: 'Arial', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
                alignment: { horizontal: 'left', vertical: 'center' },
            };
        }

        if (row === worksheetData.length - (simulationData.initialFires?.length || 0) - 1) {
            return {
                ...baseStyle,
                fill: { patternType: 'solid', fgColor: { rgb: 'F08080' } },
                font: { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
            };
        }

        if (col === 0 && worksheetData[row]?.[1] !== undefined) {
            return {
                ...baseStyle,
                fill: { patternType: 'solid', fgColor: { rgb: 'FFE4E1' } },
                font: { name: 'Arial', sz: 10, bold: true },
            };
        }

        if (worksheetData[row]?.[1] !== undefined || row >= worksheetData.length - (simulationData.initialFires?.length || 0)) {
            const isFireData = row >= worksheetData.length - (simulationData.initialFires?.length || 0);
            return {
                ...baseStyle,
                fill: { patternType: 'solid', fgColor: { rgb: isFireData ? 'FFF0F5' : 'FFFFFF' } },
                font: {
                    name: 'Arial',
                    sz: 10,
                    color: { rgb: isFireData ? '8B0000' : '000000' }
                },
            };
        }

        return baseStyle;
    };

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:D1');
    for (let row = range.s.r; row <= range.e.r; ++row) {
        for (let col = range.s.c; col <= range.e.c; ++col) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = ws[cellAddress];
            if (!cell) continue;
            cell.s = applyCellStyles(cell, row, col);
        }
    }

    const merges = [];
    if (worksheetData[0]?.length > 0) {
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } });
    }
    worksheetData.forEach((row, index) => {
        if (row.length === 1 && row[0] && index > 0) {
            merges.push({ s: { r: index, c: 0 }, e: { r: index, c: 3 } });
        }
    });
    if (merges.length > 0) {
        ws['!merges'] = merges;
    }

    ws['!rows'] = worksheetData.map((row, index) => ({
        hpt: index === 0 ? 35 : row.length === 1 && row[0] ? 28 : 22,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Simulación de Incendios');

    XLSX.writeFile(
        wb,
        `Simulacion_Incendios_${(simulationData.location || 'Sin_Ubicacion').replace(/\s+/g, '_')}_${new Date(simulationData.timestamp || Date.now()).toISOString().split('T')[0]}.xlsx`
    );
};

function getRiskInterpretation(risk) {
    if (risk >= 75) return 'Riesgo MUY ALTO - Acción inmediata requerida';
    if (risk >= 50) return 'Riesgo ALTO - Precaución extrema';
    if (risk >= 25) return 'Riesgo MODERADO - Monitoreo constante';
    return 'Riesgo BAJO - Vigilancia normal';
}