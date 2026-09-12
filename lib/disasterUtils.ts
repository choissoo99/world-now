import { getCountryFromCoordinates } from "./countryUtils";
import type { DisasterEvent, DisasterType } from "./types";

export function getDisasterLabel(type: DisasterType) {
  return {
    earthquake: "지진",
    wildfire: "산불",
    storm: "폭풍",
    volcano: "화산",
    flood: "홍수",
    other: "기타",
  }[type];
}

export function getDisasterIcon(type: DisasterType) {
  return {
    earthquake: "🔴",
    wildfire: "🔥",
    storm: "🌪️",
    volcano: "🌋",
    flood: "🌊",
    other: "⚠️",
  }[type];
}

export function calculateEarthquakeSeverity(magnitude: number) {
  if (magnitude >= 8) return 100;
  if (magnitude >= 7) return 95;
  if (magnitude >= 6) return 85;
  if (magnitude >= 5) return 70;
  if (magnitude >= 4) return 55;
  return 40;
}

export function calculateDisasterSeverity(type: DisasterType) {
  if (type === "storm") return 80;
  if (type === "volcano") return 75;
  if (type === "wildfire" || type === "flood") return 70;
  return 50;
}

function withCountry(base: DisasterEvent): DisasterEvent {
  const country = getCountryFromCoordinates(base.latitude, base.longitude);
  return {
    ...base,
    countryCode: country?.code,
    countryNameKo: country?.nameKo,
    countryNameEn: country?.nameEn,
    countryFlag: country?.flag,
  };
}

export function convertUSGSFeature(feature: any): DisasterEvent {
  const magnitude = Number(feature?.properties?.mag ?? 0);
  const coordinates = feature?.geometry?.coordinates ?? [0, 0, 0];
  return withCountry({
    id: `usgs-${feature.id}`,
    type: "earthquake",
    title: `규모 ${magnitude.toFixed(1)} 지진 - ${feature?.properties?.place ?? "위치 미상"}`,
    longitude: Number(coordinates[0]),
    latitude: Number(coordinates[1]),
    depth: Number(coordinates[2] ?? 0),
    time: new Date(feature?.properties?.time ?? Date.now()).toISOString(),
    severity: calculateEarthquakeSeverity(magnitude),
    source: "USGS",
    magnitude,
    url: feature?.properties?.url,
  });
}

export function convertEonetEvent(event: any): DisasterEvent | null {
  const geometry = event?.geometry?.[event.geometry.length - 1];
  if (!geometry || geometry.type !== "Point" || !Array.isArray(geometry.coordinates)) return null;

  const category = event?.categories?.[0]?.id;
  let type: DisasterType = "other";
  if (category === "wildfires") type = "wildfire";
  else if (category === "severeStorms") type = "storm";
  else if (category === "volcanoes") type = "volcano";
  else if (category === "floods") type = "flood";

  const [longitude, latitude] = geometry.coordinates;
  const sourceUrl = event?.sources?.[0]?.url;

  return withCountry({
    id: `eonet-${event.id}`,
    type,
    title: event?.title ?? "자연재해 이벤트",
    longitude: Number(longitude),
    latitude: Number(latitude),
    time: new Date(geometry.date ?? Date.now()).toISOString(),
    severity: calculateDisasterSeverity(type),
    source: "NASA EONET",
    url: sourceUrl,
  });
}
