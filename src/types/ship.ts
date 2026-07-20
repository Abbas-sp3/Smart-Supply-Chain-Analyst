export type Ship = {
  id: string;
  name: string;
  imo: string;
  mmsi: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  destination: string;
  shipType: string;
  country: string;
  timestamp: string;
};

export type ShipsResponse = {
  ships: Ship[];
  message?: string;
  status?: "connected" | "reconnecting" | "unavailable";
};
