import { useEffect, useState } from "react";

export const useVolunteersEstimator = (fires, config) => {
    const [requiredVolunteers, setRequiredVolunteers] = useState(0);

    useEffect(() => {
        const activeFires = fires.filter(f => f.active);
        let volunteers = 0;

        activeFires.forEach(fire => {
            const area = Math.PI * Math.pow(fire.spread * 100, 2) / 100;
            volunteers += config.VOLUNTEERS_PER_FIRE +
                (fire.intensity * config.VOLUNTEERS_PER_INTENSITY) +
                (area * config.VOLUNTEERS_PER_AREA);
        });

        setRequiredVolunteers(Math.round(volunteers));
    }, [fires, config]);

    return requiredVolunteers;
};
