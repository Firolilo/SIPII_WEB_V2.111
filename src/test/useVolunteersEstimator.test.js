import { renderHook } from "@testing-library/react";
import { useVolunteersEstimator } from "../components/useVolunteersEstimator";

test("calcula correctamente la cantidad de voluntarios necesarios", () => {
    const fires = [
        {
            active: true,
            spread: 1,
            intensity: 2
        },
        {
            active: true,
            spread: 0.5,
            intensity: 1
        }
    ];

    const config = {
        VOLUNTEERS_PER_FIRE: 5,
        VOLUNTEERS_PER_INTENSITY: 2,
        VOLUNTEERS_PER_AREA: 0.1
    };

    const { result } = renderHook(() => useVolunteersEstimator(fires, config));

    // Cálculo esperado:
    // Fuego 1: 5 + 2*2 + (π * 100^2 / 100 * 0.1) = 5 + 4 + ~31.4 ≈ 40.4
    // Fuego 2: 5 + 1*2 + (π * 50^2 / 100 * 0.1) = 5 + 2 + ~7.85 ≈ 14.85
    // Total ≈ 55.25 => redondeado = 55
    expect(result.current).toBe(55);
});
