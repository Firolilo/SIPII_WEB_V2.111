import { renderHook } from "@testing-library/react";
import { useFireRiskCalculator } from "../components/useFireRiskCalculator";

test("calcula correctamente el riesgo de incendio", () => {
    const { result } = renderHook(() =>
        useFireRiskCalculator({ temperature: 25, humidity: 50, windSpeed: 10 })
    );

    expect(result.current).toBe(50);
});
