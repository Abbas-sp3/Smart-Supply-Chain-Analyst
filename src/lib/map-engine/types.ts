/**
 * Provider-agnostic map types.
 * Swap the MapInstance import when changing map engines.
 */
export type { Map as MapInstance, MapOptions as MapInstanceOptions } from "maplibre-gl";

export type MapEngineId = "maplibre";

export const ACTIVE_MAP_ENGINE: MapEngineId = "maplibre";
