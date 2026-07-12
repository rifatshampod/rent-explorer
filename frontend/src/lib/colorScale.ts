
import { scaleQuantile } from "d3-scale";
import { schemeYlOrRd } from "d3-scale-chromatic";

// 5 classes from the Yellow-Orange-Red sequential scheme
const COLORS = schemeYlOrRd[5] as readonly string[];

// Color used for areas with no median (empty polygons / no listings inside).
export const NO_DATA_COLOR = "#cccccc";

export interface ChoroplethScale {
  /** Map a median €/m² value to a fill color. null -> NO_DATA_COLOR. */
  color: (value: number | null) => string;
  /** Legend rows: the color and the [min, max] value range it covers. */
  legend: { color: string; min: number; max: number }[];
}

export function buildChoroplethScale(values: (number | null)[]): ChoroplethScale {
  const domain = values.filter((v): v is number => v !== null);

  // Guard: if there's no data at all, everything is "no data".
  if (domain.length === 0) {
    return {
      color: () => NO_DATA_COLOR,
      legend: [],
    };
  }

  const scale = scaleQuantile<string>().domain(domain).range(COLORS);
  const legend = COLORS.map((color) => {
    const [min, max] = scale.invertExtent(color);
    return { color, min, max };
  });

  return {
    color: (value: number | null) => (value === null ? NO_DATA_COLOR : scale(value)),
    legend,
  };
}
