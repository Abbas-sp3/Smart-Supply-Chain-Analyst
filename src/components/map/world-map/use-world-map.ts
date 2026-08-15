"use client";

import { useEffect, type RefObject } from "react";

import { Map } from "@/lib/maplibre/client";
import { useMap } from "@/components/map/map-provider";
import {
  configureWorldMapInteractions,
  createWorldMapOptions,
} from "@/lib/maplibre";
import { useCountry } from "@/hooks/useCountry";

type UseWorldMapOptions = {
  containerRef: RefObject<HTMLDivElement | null>;
};

export function useWorldMap({ containerRef }: UseWorldMapOptions) {
  const { map, setMap, setIsReady } = useMap();
  const { activeCountry } = useCountry();

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const newMap = new Map(
      createWorldMapOptions(container, {
        center: activeCountry.mapView.center,
        zoom: activeCountry.mapView.zoom,
      }),
    );

    configureWorldMapInteractions(newMap);

    newMap.on("load", () => {
      configureWorldMapInteractions(newMap);
      newMap.resize();
      setIsReady(true);
    });

    setMap(newMap);

    const resizeObserver = new ResizeObserver(() => {
      newMap.resize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      newMap.remove();
      setMap(null);
      setIsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, setMap, setIsReady]);

  // Handle flyTo when country changes
  useEffect(() => {
    if (map) {
      map.flyTo({
        center: activeCountry.mapView.center,
        zoom: activeCountry.mapView.zoom,
        duration: 2000,
      });
    }
  }, [map, activeCountry.id, activeCountry.mapView.center, activeCountry.mapView.zoom]);
}
