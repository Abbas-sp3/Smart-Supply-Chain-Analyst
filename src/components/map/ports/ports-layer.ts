"use client";

import type { MapLayerMouseEvent } from "maplibre-gl";

import type { MapInstance } from "@/lib/map-engine";
import { Popup } from "@/lib/maplibre/client";

import { buildPointCollection } from "@/components/map/animations";
import { ENERGY_PORTS } from "./constants/energy-ports";
import {
  PORTS_CORE_LAYER,
  PORTS_HALO_LAYER,
  PORTS_SOURCE,
} from "./constants/layer-ids";

export function addPortsLayer(map: MapInstance) {
  map.addSource(PORTS_SOURCE, {
    type: "geojson",
    data: buildPointCollection(
      ENERGY_PORTS.map((port) => ({
        id: port.id,
        name: port.name,
        country: port.country,
        coordinates: port.coordinates,
      })),
    ),
  });

  map.addLayer({
    id: PORTS_HALO_LAYER,
    type: "circle",
    source: PORTS_SOURCE,
    paint: {
      "circle-radius": 5,
      "circle-color": "#d97706",
      "circle-opacity": 0.12,
      "circle-blur": 0.6,
    },
  });

  map.addLayer({
    id: PORTS_CORE_LAYER,
    type: "circle",
    source: PORTS_SOURCE,
    paint: {
      "circle-radius": 2,
      "circle-color": "#fbbf24",
      "circle-opacity": 0.75,
      "circle-stroke-width": 0.5,
      "circle-stroke-color": "#fde68a",
      "circle-stroke-opacity": 0.4,
    },
  });

  const popup = new Popup({
    closeButton: false,
    closeOnClick: false,
    className: "map-port-popup",
    offset: 8,
  });

  const onMouseMove = (event: MapLayerMouseEvent) => {
    const features = map.queryRenderedFeatures(event.point, {
      layers: [PORTS_CORE_LAYER, PORTS_HALO_LAYER],
    });

    if (!features.length) {
      map.getCanvas().style.cursor = "";
      popup.remove();
      return;
    }

    const feature = features[0];
    const name = feature.properties?.name ?? "";
    const country = feature.properties?.country ?? "";
    const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [
      number,
      number,
    ];

    map.getCanvas().style.cursor = "pointer";
    popup
      .setLngLat(coordinates)
      .setHTML(
        `<span class="map-port-popup__name">${name}</span><span class="map-port-popup__country">${country}</span>`,
      )
      .addTo(map);
  };

  const onMouseLeave = () => {
    map.getCanvas().style.cursor = "";
    popup.remove();
  };

  map.on("mousemove", onMouseMove);
  map.on("mouseleave", onMouseLeave);

  return () => {
    map.off("mousemove", onMouseMove);
    map.off("mouseleave", onMouseLeave);
    popup.remove();
  };
}

export function removePortsLayer(map: MapInstance) {
  if (map.getLayer(PORTS_CORE_LAYER)) {
    map.removeLayer(PORTS_CORE_LAYER);
  }

  if (map.getLayer(PORTS_HALO_LAYER)) {
    map.removeLayer(PORTS_HALO_LAYER);
  }

  if (map.getSource(PORTS_SOURCE)) {
    map.removeSource(PORTS_SOURCE);
  }
}
