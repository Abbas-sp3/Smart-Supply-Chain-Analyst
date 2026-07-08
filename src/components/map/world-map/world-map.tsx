"use client";

import { useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

import { useWorldMap } from "./use-world-map";

export function WorldMap() {
  const containerRef = useRef<HTMLDivElement>(null);

  useWorldMap({ containerRef });

  return <div ref={containerRef} className="map-container size-full" />;
}
