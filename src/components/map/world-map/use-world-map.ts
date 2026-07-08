"use client";

import { useEffect, type RefObject } from "react";

import { Map } from "@/lib/maplibre/client";
import { useMap } from "@/components/map/map-provider";
import {
  configureWorldMapInteractions,
  createWorldMapOptions,
} from "@/lib/maplibre";

type UseWorldMapOptions = {
  containerRef: RefObject<HTMLDivElement | null>;
};

export function useWorldMap({ containerRef }: UseWorldMapOptions) {
  const { setMap, setIsReady } = useMap();

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const map = new Map(createWorldMapOptions(container));

    configureWorldMapInteractions(map);

    map.on("load", () => {
      configureWorldMapInteractions(map);
      map.resize();
      setIsReady(true);
    });

    setMap(map);

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      setMap(null);
      setIsReady(false);
    };
  }, [containerRef, setMap, setIsReady]);
}
