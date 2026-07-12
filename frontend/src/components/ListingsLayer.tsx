
import { Marker, Popup, Tooltip } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import { ListingPopup } from "./ListingPopup";
import { buildAreaIndex, findArea } from "../lib/areaLookup";
import { pinIcon } from "../lib/pinIcon";
import { signalColor, valueSignal } from "../lib/valueSignal";
import type { AreaStatsResponse, Listing } from "../types";

interface Props {
  listings: Listing[];
  areaStats: AreaStatsResponse | undefined;
}

export function ListingsLayer({ listings, areaStats }: Props) {
  // Build the area bbox index once per render (cheap: 12 boxes).
  const areaIndex = buildAreaIndex(areaStats);

  return (
    <MarkerClusterGroup
      maxClusterRadius={45}
      showCoverageOnHover
      disableClusteringAtZoom={15}
    >
      {listings.map((l) => {
        // Resolve the listing's area once, use it for BOTH the pin color and
        // the popup — so they always tell the same story.
        const area = findArea(areaIndex, l.latitude, l.longitude);
        const color = signalColor(valueSignal(l, area));

        return (
          <Marker
            key={l.listing_id}
            position={[l.latitude, l.longitude]}
            icon={pinIcon(color)}
          >
            {/* Quick-glance hover label: rent, to compare without clicking. */}
            <Tooltip direction="top">
              {l.rent_eur !== null ? `${l.rent_eur} €` : "rent —"}
            </Tooltip>
            <Popup>
              <ListingPopup listing={l} area={area} />
            </Popup>
          </Marker>
        );
      })}
    </MarkerClusterGroup>
  );
}
