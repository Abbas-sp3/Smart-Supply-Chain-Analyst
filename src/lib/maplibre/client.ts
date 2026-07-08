"use client";

import type { Map as MapLibreMap, Marker as MapLibreMarker, Popup as MapLibrePopup } from "maplibre-gl";
import * as maplibreModule from "maplibre-gl";

type MapLibreRuntime = {
  Map: typeof MapLibreMap;
  Marker: typeof MapLibreMarker;
  Popup: typeof import("maplibre-gl").Popup;
};

function loadMapLibre(): MapLibreRuntime {
  const runtime =
    (maplibreModule as { default?: MapLibreRuntime }).default ?? maplibreModule;

  if (
    typeof runtime.Map !== "function" ||
    typeof runtime.Marker !== "function" ||
    typeof runtime.Popup !== "function"
  ) {
    throw new Error("MapLibre GL failed to load Map, Marker, or Popup.");
  }

  return runtime as MapLibreRuntime;
}

const maplibre = loadMapLibre();

export const Map = maplibre.Map;
export const Marker = maplibre.Marker;
export const Popup = maplibre.Popup;

export type MapLibreMapClass = MapLibreMap;
export type MapLibreMarkerClass = MapLibreMarker;
export type MapLibrePopupClass = MapLibrePopup;
