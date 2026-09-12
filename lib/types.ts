export type DisasterType =
  | "earthquake"
  | "wildfire"
  | "storm"
  | "volcano"
  | "flood"
  | "other";

export type DisasterEvent = {
  id: string;
  type: DisasterType;
  title: string;
  latitude: number;
  longitude: number;
  time: string;
  severity: number;
  source: string;
  magnitude?: number;
  depth?: number;
  url?: string;
  countryCode?: string;
  countryNameKo?: string;
  countryNameEn?: string;
  countryFlag?: string;
};

export type TimeFilter = "24h" | "7d" | "30d";
export type RegionFilter =
  | "world"
  | "asia"
  | "europe"
  | "north-america"
  | "south-america"
  | "africa"
  | "oceania";
