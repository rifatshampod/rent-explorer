
import { PROPERTY_TYPES } from "../config";
import type { Filters, PropertyType } from "../types";

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function FilterPanel({ filters, onChange }: Props) {
  // Helper: produce a new Filters object with one field replaced, then emit.
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });

  // Parse a text input into number|null (empty -> null = "no filter").
  const toNum = (v: string): number | null => (v === "" ? null : Number(v));

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <h3 style={{ margin: "0 0 4px" }}>Filters</h3>

      <label style={{ display: "grid", gap: 2 }}>
        Rent min (€)
        <input
          type="number"
          min={0}
          value={filters.rentMin ?? ""}
          onChange={(e) => set("rentMin", toNum(e.target.value))}
        />
      </label>

      <label style={{ display: "grid", gap: 2 }}>
        Rent max (€)
        <input
          type="number"
          min={0}
          value={filters.rentMax ?? ""}
          onChange={(e) => set("rentMax", toNum(e.target.value))}
        />
      </label>

      <label style={{ display: "grid", gap: 2 }}>
        Rooms
        <input
          type="number"
          min={0}
          value={filters.rooms ?? ""}
          onChange={(e) => set("rooms", toNum(e.target.value))}
        />
      </label>

      <label style={{ display: "grid", gap: 2 }}>
        Property type
        <select
          value={filters.propertyType ?? ""}
          onChange={(e) =>
            set("propertyType", (e.target.value || null) as PropertyType | null)
          }
        >
          <option value="">Any</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={() =>
          onChange({ rentMin: null, rentMax: null, rooms: null, propertyType: null })
        }
      >
        Clear filters
      </button>
    </div>
  );
}
