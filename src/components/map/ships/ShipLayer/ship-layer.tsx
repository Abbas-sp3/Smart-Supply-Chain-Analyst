"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useMap } from "@/components/map/map-provider";
import { createAnimationLoop } from "@/components/map/animations";
import { Popup, Marker, type MapLibreMarkerClass, type MapLibrePopupClass } from "@/lib/maplibre/client";
import { getShips } from "@/services/shipService";
import type { Ship } from "@/types/ship";

import {
  buildShipPopupContent,
  createShipMarkerElement,
  updateShipMarkerElement,
} from "../ShipMarker";

const POLL_INTERVAL_MS = 15_000;

type ShipMarkerState = {
  marker: MapLibreMarkerClass;
  element: HTMLElement;
  current: { latitude: number; longitude: number };
  target: { latitude: number; longitude: number };
  heading: number;
  ship: Ship;
};

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

export function ShipLayer() {
  const { map, isReady } = useMap();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const markersRef = useRef<Map<string, ShipMarkerState>>(new Map());
  const popupRef = useRef<MapLibrePopupClass | null>(null);
  const selectedShipIdRef = useRef<string | null>(null);
  const animationStartRef = useRef<number>(0);

  const openPopup = useCallback(
    (ship: Ship) => {
      if (!map) {
        return;
      }

      selectedShipIdRef.current = ship.id;
      popupRef.current?.remove();

      const popup = new Popup({
        closeButton: true,
        closeOnClick: true,
        className: "map-ship-popup-container",
        offset: 12,
      })
        .setLngLat([ship.longitude, ship.latitude])
        .setHTML(buildShipPopupContent(ship))
        .addTo(map);

      popup.on("close", () => {
        selectedShipIdRef.current = null;
      });

      popupRef.current = popup;
    },
    [map],
  );

  const syncMarkers = useCallback(
    (ships: Ship[]) => {
      if (!map) {
        return;
      }

      const nextIds = new Set(ships.map((ship) => ship.id));
      const markers = markersRef.current;

      for (const ship of ships) {
        const existing = markers.get(ship.id);

        if (existing) {
          existing.target = {
            latitude: ship.latitude,
            longitude: ship.longitude,
          };
          existing.heading = ship.heading;
          existing.ship = ship;
          continue;
        }

        const element = createShipMarkerElement();
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          openPopup(ship);
        });

        updateShipMarkerElement(element, ship.heading);

        const marker = new Marker({
          element,
          anchor: "center",
          rotationAlignment: "map",
        })
          .setLngLat([ship.longitude, ship.latitude])
          .addTo(map);

        markers.set(ship.id, {
          marker,
          element,
          current: {
            latitude: ship.latitude,
            longitude: ship.longitude,
          },
          target: {
            latitude: ship.latitude,
            longitude: ship.longitude,
          },
          heading: ship.heading,
          ship,
        });
      }

      for (const [id, state] of markers.entries()) {
        if (!nextIds.has(id)) {
          state.marker.remove();
          markers.delete(id);
        }
      }

      animationStartRef.current = performance.now();
    },
    [map, openPopup],
  );

  useEffect(() => {
    if (!map || !isReady) {
      return;
    }

    let cancelled = false;

    const loadShips = async () => {
      const response = await getShips();

      if (cancelled) {
        return;
      }

      if (response.message && response.ships.length === 0) {
        setStatusMessage(response.message);
        syncMarkers([]);
        return;
      }

      setStatusMessage(null);
      syncMarkers(response.ships);

      const selectedId = selectedShipIdRef.current;

      if (selectedId) {
        const selectedShip = response.ships.find((ship) => ship.id === selectedId);

        if (selectedShip) {
          popupRef.current
            ?.setLngLat([selectedShip.longitude, selectedShip.latitude])
            .setHTML(buildShipPopupContent(selectedShip));
        }
      }
    };

    void loadShips();
    const intervalId = window.setInterval(() => {
      void loadShips();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [map, isReady, syncMarkers]);

  useEffect(() => {
    if (!map || !isReady) {
      return;
    }

    const markers = markersRef.current;

    const stop = createAnimationLoop(() => {
      const progress = Math.min(
        (performance.now() - animationStartRef.current) / POLL_INTERVAL_MS,
        1,
      );

      for (const state of markers.values()) {
        const latitude = lerp(
          state.current.latitude,
          state.target.latitude,
          progress,
        );
        const longitude = lerp(
          state.current.longitude,
          state.target.longitude,
          progress,
        );

        state.marker.setLngLat([longitude, latitude]);
        updateShipMarkerElement(state.element, state.heading);

        if (progress >= 1) {
          state.current = { ...state.target };
        }
      }
    });

    return stop;
  }, [map, isReady]);

  useEffect(() => {
    const markers = markersRef.current;

    return () => {
      popupRef.current?.remove();

      for (const state of markers.values()) {
        state.marker.remove();
      }

      markers.clear();
    };
  }, []);

  if (!statusMessage) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute bottom-20 left-4 z-[4] rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-slate-300">
      {statusMessage}
    </div>
  );
}
