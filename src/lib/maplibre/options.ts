import type { MapInstance, MapInstanceOptions } from "@/lib/map-engine";

import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_STYLE,
  DEFAULT_MAP_ZOOM,
} from "./config";

export const WORLD_MAP_OPTIONS = {
  style: DEFAULT_MAP_STYLE,
  center: DEFAULT_MAP_CENTER,
  zoom: DEFAULT_MAP_ZOOM,
  minZoom: 1,
  maxZoom: 18,
  dragRotate: false,
  pitchWithRotate: false,
  touchPitch: false,
  maxPitch: 0,
  minPitch: 0,
  bearing: 0,
  pitch: 0,
  renderWorldCopies: true,
  fadeDuration: 300,
  trackResize: true,
  refreshExpiredTiles: false,
  attributionControl: false,
} as const satisfies Partial<MapInstanceOptions>;

export function createWorldMapOptions(
  container: HTMLElement,
): MapInstanceOptions {
  return {
    ...WORLD_MAP_OPTIONS,
    container,
  };
}

export function configureWorldMapInteractions(map: MapInstance) {
  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();
  map.setMaxPitch(0);
  map.setMinPitch(0);
}
