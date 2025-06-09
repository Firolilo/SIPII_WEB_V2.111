import { useEffect, useState } from "react";

export const useFireRiskCalculator = ({ temperature, humidity, windSpeed }) => {
    const [fireRisk, setFireRisk] = useState(0);

    useEffect(() => {
        const tempFactor = Math.min(temperature / 40, 1);
        const humFactor = 1 - humidity / 100;
        const windFactor = Math.min(windSpeed / 30, 1);
        const risk = Math.round((tempFactor * 0.4 + humFactor * 0.3 + windFactor * 0.3) * 100);
        setFireRisk(Math.min(risk, 100));
    }, [temperature, humidity, windSpeed]);

    return fireRisk;
};
