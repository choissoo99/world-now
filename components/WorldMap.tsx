"use client";

import { useMemo, useState } from "react";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { DisasterEvent, DisasterType } from "@/lib/types";
import { getDisasterIcon, getDisasterLabel } from "@/lib/disasterUtils";

type FilterType = "all" | Exclude<DisasterType, "other">;

type Props = {
  events: DisasterEvent[];
  selectedEvent: DisasterEvent | null;
  onSelect: (event: DisasterEvent) => void;
  focusRequest: number;
};

const filters: Array<{ key: FilterType; label: string }> = [
  { key: "all", label: "전체" },
  { key: "earthquake", label: "🔴 지진" },
  { key: "wildfire", label: "🔥 산불" },
  { key: "storm", label: "🌪️ 폭풍" },
  { key: "volcano", label: "🌋 화산" },
  { key: "flood", label: "🌊 홍수" },
];

function MapController({ event, focusRequest }: { event: DisasterEvent | null; focusRequest: number }) {
  const map = useMap();
  useMemo(() => {
    if (event) {
      window.setTimeout(() => map.flyTo([event.latitude, event.longitude], Math.max(map.getZoom(), 6), { duration: 1.1 }), 0);
    }
  }, [event, focusRequest, map]);
  return null;
}

function ZoomWatcher({ onZoom }: { onZoom: (zoom: number) => void }) {
  useMapEvents({
    zoomend(event) {
      onZoom(event.target.getZoom());
    },
  });
  return null;
}

function markerIcon(event: DisasterEvent, zoom: number, selected: boolean) {
  let size = zoom >= 8 ? 24 : zoom >= 6 ? 20 : zoom >= 4 ? 17 : 14;
  if (event.type === "earthquake" && event.magnitude) size += Math.max(0, event.magnitude - 4) * 1.5;
  if (selected) size += 8;
  const colors: Record<DisasterType, string> = {
    earthquake: "#ff4d61",
    wildfire: "#ff8a3d",
    storm: "#9b7cff",
    volcano: "#ff5f45",
    flood: "#3a9cff",
    other: "#9ca9bc",
  };
  return L.divIcon({
    className: "world-now-marker-wrap",
    html: `<span class="world-now-marker${selected ? " selected" : ""}" style="width:${size}px;height:${size}px;background:${colors[event.type]}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function WorldMap({ events, selectedEvent, onSelect, focusRequest }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [zoom, setZoom] = useState(2);

  const visible = useMemo(
    () => (activeFilter === "all" ? events : events.filter((event) => event.type === activeFilter)),
    [events, activeFilter]
  );

  const count = (key: FilterType) => key === "all" ? events.length : events.filter((event) => event.type === key).length;

  return (
    <section className="mapCard">
      <div className="mapCardHeader">
        <div>
          <span className="eyebrow">LIVE WORLD MAP</span>
          <h2>실시간 자연재해 지도</h2>
        </div>
        <span className="mapCount">{visible.length}건 표시</span>
      </div>

      <div className="disasterFilters" aria-label="재난 유형 필터">
        {filters.map((filter) => (
          <button
            key={filter.key}
            className={`filterButton ${activeFilter === filter.key ? "active" : ""}`}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label} <b>{count(filter.key)}</b>
          </button>
        ))}
      </div>

      <div className="worldMap">
        <MapContainer center={[20, 0]} zoom={2} minZoom={2} scrollWheelZoom worldCopyJump className="leafletMap">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomWatcher onZoom={setZoom} />
          <MapController event={selectedEvent} focusRequest={focusRequest} />

          <MarkerClusterGroup chunkedLoading maxClusterRadius={45} showCoverageOnHover={false} spiderfyOnMaxZoom>
            {visible.map((event) => {
              const selected = selectedEvent?.id === event.id;
              return (
                <Marker
                  key={event.id}
                  position={[event.latitude, event.longitude]}
                  icon={markerIcon(event, zoom, selected)}
                  eventHandlers={{ click: () => onSelect(event) }}
                >
                  <Popup>
                    <div className="mapPopup">
                      <strong>{getDisasterIcon(event.type)} {getDisasterLabel(event.type)}</strong>
                      <p>{event.title}</p>
                      <small>{event.countryFlag} {event.countryNameKo ?? "국가 미확인"} · 위험도 {event.severity}</small>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </section>
  );
}
