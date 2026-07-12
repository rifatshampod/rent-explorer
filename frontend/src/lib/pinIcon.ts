
import { divIcon, type DivIcon } from "leaflet";

const PIN_W = 26;
const PIN_H = 36;

const cache = new Map<string, DivIcon>();

/** A classic map-pin path: round head + pointed base, tip at the bottom. */
function pinSvg(color: string): string {
  return `
    <svg width="${PIN_W}" height="${PIN_H}" viewBox="0 0 26 36"
         xmlns="http://www.w3.org/2000/svg" class="pin-svg">
      <path d="M13 0C6 0 0.5 5.5 0.5 12.5c0 8.5 10.5 21 12 22.7.3.3.7.3 1 0
               1.5-1.7 12-14.2 12-22.7C25.5 5.5 20 0 13 0z"
            fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="13" cy="12.5" r="4.5" fill="#ffffff"/>
    </svg>`;
}

/** Return a cached Leaflet DivIcon for the given pin color. */
export function pinIcon(color: string): DivIcon {
  const cached = cache.get(color);
  if (cached) return cached;

  const icon = divIcon({
    html: pinSvg(color),
    className: "listing-pin", // styled in index.css (drop shadow, hover)
    iconSize: [PIN_W, PIN_H],
    // Anchor at the TIP (bottom-centre) so the point sits on the coordinate.
    iconAnchor: [PIN_W / 2, PIN_H],
    // Popup opens just above the head, not over the tip.
    popupAnchor: [0, -PIN_H + 6],
    tooltipAnchor: [0, -PIN_H + 10],
  });
  cache.set(color, icon);
  return icon;
}
