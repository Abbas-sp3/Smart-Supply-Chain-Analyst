"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { MapInstance } from "@/lib/map-engine";

type MapContextValue = {
  map: MapInstance | null;
  isReady: boolean;
  setMap: (map: MapInstance | null) => void;
  setIsReady: (ready: boolean) => void;
};

const MapContext = createContext<MapContextValue | null>(null);

type MapProviderProps = {
  children: ReactNode;
};

export function MapProvider({ children }: MapProviderProps) {
  const [map, setMapState] = useState<MapInstance | null>(null);
  const [isReady, setIsReadyState] = useState(false);

  const setMap = useCallback((instance: MapInstance | null) => {
    setMapState(instance);
  }, []);

  const setIsReady = useCallback((ready: boolean) => {
    setIsReadyState(ready);
  }, []);

  const value = useMemo(
    () => ({
      map,
      isReady,
      setMap,
      setIsReady,
    }),
    [map, isReady, setMap, setIsReady],
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMap() {
  const context = useContext(MapContext);

  if (!context) {
    throw new Error("useMap must be used within MapProvider");
  }

  return context;
}
