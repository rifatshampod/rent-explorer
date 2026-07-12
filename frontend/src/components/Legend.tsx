
import { NO_DATA_COLOR, type ChoroplethScale } from "../lib/colorScale";

interface Props {
  scale: ChoroplethScale;
}

export function Legend({ scale }: Props) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <h3 style={{ margin: "0 0 4px" }}>Median €/m² by area</h3>
      {scale.legend.map((row, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 18,
              height: 18,
              background: row.color,
              border: "1px solid #999",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 13 }}>
            {row.min.toFixed(1)} – {row.max.toFixed(1)}
          </span>
        </div>
      ))}
      {/* Explicit "no data" key for empty areas. */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 18,
            height: 18,
            background: NO_DATA_COLOR,
            border: "1px solid #999",
            display: "inline-block",
          }}
        />
        <span style={{ fontSize: 13 }}>no data</span>
      </div>
    </div>
  );
}
