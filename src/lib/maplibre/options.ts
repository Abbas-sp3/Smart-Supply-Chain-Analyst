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
  minZoom: DEFAULT_MAP_ZOOM,
  maxZoom: DEFAULT_MAP_ZOOM,
  // Disable all interactions — map is a static decorative backdrop
  scrollZoom: false,
  dragPan: false,
  dragRotate: false,
  doubleClickZoom: false,
  keyboard: false,
  touchZoomRotate: false,
  touchPitch: false,
  // Pitch/rotation locked flat
  pitchWithRotate: false,
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
  // Belt-and-suspenders: disable all handlers after map creation too
  map.scrollZoom.disable();
  map.dragPan.disable();
  map.dragRotate.disable();
  map.doubleClickZoom.disable();
  map.keyboard.disable();
  map.touchZoomRotate.disable();
  map.setMaxPitch(0);
  map.setMinPitch(0);
}
