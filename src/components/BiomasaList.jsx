import React, {useState, useMemo, useEffect} from 'react';
import { colors } from '../styles/theme';

const BiomasaList = ({ biomasas, onDelete, onFiltered }) => {
    const [filter, setFilter] = useState('');
    const [filterBy, setFilterBy] = useState('tipoBiomasa');
    const [selectedFilterValue, setSelectedFilterValue] = useState('');
    const [densityFilter, setDensityFilter] = useState('');

    // Valores únicos para cada filtro
    const uniqueValues = useMemo(() => {
        if (filterBy === 'tipoBiomasa') {
            return ['bosque', 'sabana', 'humedal', 'pastizal', 'arbustivo'];
        }
        if (filterBy === 'estadoConservacion') {
            return ['excelente', 'bueno', 'regular', 'degradado'];
        }
        return [];
    }, [filterBy]);

    // Filtrar biomasas
    const filteredBiomasas = useMemo(() => {
        return biomasas.filter(biomasa => {
            const matchesTextFilter = filter === '' ||
                biomasa[filterBy]?.toString().toLowerCase().includes(filter.toLowerCase());

            const matchesSelectedFilter = selectedFilterValue === '' ||
                biomasa[filterBy]?.toString().toLowerCase() === selectedFilterValue.toLowerCase();

            const matchesDensityFilter = densityFilter === '' ||
                biomasa.densidad?.toString().toLowerCase() === densityFilter.toLowerCase();

            return matchesTextFilter && matchesSelectedFilter && matchesDensityFilter;
        });
    }, [filter, selectedFilterValue, filterBy, densityFilter, biomasas]);

    useEffect(() => {
        if (onFiltered) {
            onFiltered(filteredBiomasas);
        }
    }, [filteredBiomasas, onFiltered]);

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '15px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            height: '100%',
            width: '100%',
            maxHeight: 'calc(100vh - 200px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h3 style={{
                margin: '0 0 15px 0',
                color: colors.primary,
                fontSize: '1.2rem',
                fontWeight: '500'
            }}>
                Áreas de Biomasa ({filteredBiomasas.length})
            </h3>

            {/* Filtros */}
            <div style={{
                marginBottom: '15px',
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '10px',
                width: '100%'
            }}>
                <div style={{width: '100%'}}>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '4px',
                            border: `1px solid ${colors.lightGray}`,
                            fontSize: '0.9rem',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '8px',
                    width: '100%'
                }}>
                    <div>
                        <select
                            value={filterBy}
                            onChange={(e) => {
                                setFilterBy(e.target.value);
                                setSelectedFilterValue('');
                            }}
                            style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                border: `1px solid ${colors.lightGray}`
                            }}
                        >
                            <option value="tipoBiomasa">Tipo</option>
                            <option value="estadoConservacion">Estado</option>
                        </select>
                    </div>

                    <div>
                        <select
                            value={selectedFilterValue}
                            onChange={(e) => setSelectedFilterValue(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                border: `1px solid ${colors.lightGray}`
                            }}
                        >
                            <option value="">Todos</option>
                            {uniqueValues.map((value, index) => (
                                <option key={index} value={value}>
                                    {value.charAt(0).toUpperCase() + value.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <select
                            value={densityFilter}
                            onChange={(e) => setDensityFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                border: `1px solid ${colors.lightGray}`
                            }}
                        >
                            <option value="">Cualq. densidad</option>
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista de biomasas */}
            <div style={{
                overflowY: 'auto',
                flex: 1,
                paddingRight: '5px',
                width: '100%',
                boxSizing: 'border-box',
                scrollbarWidth: 'thin',
                scrollbarColor: `${colors.lightGray} transparent`,
                '::-webkit-scrollbar': {
                    width: '6px'
                },
                '::-webkit-scrollbar-thumb': {
                    backgroundColor: colors.lightGray,
                    borderRadius: '3px'
                },
                '::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent'
                }
            }}>
                {filteredBiomasas.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        color: colors.gray,
                        padding: '20px 0',
                        fontSize: '0.9rem'
                    }}>
                        No hay biomasas que coincidan con los filtros
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gap: '10px',
                        gridTemplateColumns: '1fr',
                        width: '100%'
                    }}>
                        {filteredBiomasas.map(biomasa => (
                            <div
                                key={biomasa.id}
                                style={{
                                    backgroundColor: 'white',
                                    border: `1px solid ${colors.lightGray}`,
                                    borderRadius: '6px',
                                    padding: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '6px',
                                    width: '100%'
                                }}>
                                    <strong style={{
                                        color: colors.primary,
                                        fontSize: '0.95rem',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '60%'
                                    }}>
                                        {biomasa.tipoBiomasa?.charAt(0).toUpperCase() + biomasa.tipoBiomasa?.slice(1)}
                                    </strong>
                                    <span style={{
                                        color: colors.gray,
                                        fontSize: '0.8rem',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {biomasa.fecha ? new Date(biomasa.fecha).toLocaleDateString() : 'Sin fecha'}
                                    </span>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '6px',
                                    fontSize: '0.85rem',
                                    width: '100%'
                                }}>
                                    <span style={{whiteSpace: 'nowrap'}}>Área: {biomasa.area || '--'} km²</span>
                                    <span style={{
                                        backgroundColor: getStatusColor(biomasa.estadoConservacion),
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {biomasa.estadoConservacion?.charAt(0).toUpperCase() + biomasa.estadoConservacion?.slice(1)}
                                    </span>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    width: '100%'
                                }}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                                        <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Densidad: </span>
                                        <span style={{
                                            backgroundColor: getDensityColor(biomasa.densidad),
                                            color: 'white',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {biomasa.densidad?.charAt(0).toUpperCase() + biomasa.densidad?.slice(1)}
                                        </span>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(biomasa.id);
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: colors.danger,
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            padding: '2px 6px',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper functions
function getStatusColor(status) {
    if (!status) return colors.gray;
    switch(status.toLowerCase()) {
        case 'excelente': return colors.success;
        case 'bueno': return colors.info;
        case 'regular': return colors.warning;
        case 'degradado': return colors.danger;
        default: return colors.gray;
    }
}

function getDensityColor(density) {
    if (!density) return colors.gray;
    switch(density.toLowerCase()) {
        case 'alta': return '#2e7d32';
        case 'media': return '#7cb342';
        case 'baja': return '#c0ca33';
        default: return colors.gray;
    }
}

export default BiomasaList;