// src/graphql/queries.js
import { gql } from '@apollo/client';

export const GET_DASHBOARD_DATA = gql`
    query GetDashboardData {
        getChiquitosFireRiskData(count: 1) {
            id
            timestamp
            location
            coordinates {
                lng
                lat
            }
            weather {
                temperature
                humidity
                windSpeed
                windDirection
                precipitation
                season
            }
            environmentalFactors {
                droughtIndex
                vegetationType
                vegetationDryness
                humanActivityIndex
                regionalFactor
            }
            fireRisk
            fireDetected
        }
    }
`;

export const GET_DETAILED_DATA = gql`
    query GetDetailedData {
        getChiquitosFireRiskData(count: 1) {
            weather {
                temperature
                humidity
                windSpeed
                precipitation
            }
            environmentalFactors {
                droughtIndex
                vegetationDryness
            }
            fireRisk
        }
    }
`;