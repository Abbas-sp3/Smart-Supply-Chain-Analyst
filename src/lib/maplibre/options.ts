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
  maxZoom: 10,
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
} satisfies Partial<MapInstanceOptions>;

export function createWorldMapOptions(
  container: HTMLElement,
  overrides?: { center?: [number, number]; zoom?: number },
): MapInstanceOptions {
  return {
    ...WORLD_MAP_OPTIONS,
    container,
    ...(overrides?.center !== undefined ? { center: overrides.center } : {}),
    ...(overrides?.zoom !== undefined ? { zoom: overrides.zoom } : {}),
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
