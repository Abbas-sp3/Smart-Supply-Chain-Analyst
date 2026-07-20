"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type AisConnectionStatus = "connected" | "reconnecting" | "unavailable";

type AisStatusContextValue = {
  status: AisConnectionStatus;
  lastUpdated: Date | null;
  setStatus: (status: AisConnectionStatus) => void;
  setLastUpdated: (date: Date | null) => void;
};

const AisStatusContext = createContext<AisStatusContextValue>({
  status: "unavailable",
  lastUpdated: null,
  setStatus: () => undefined,
  setLastUpdated: () => undefined,
});

export function AisStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AisConnectionStatus>("unavailable");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleSetStatus = useCallback((s: AisConnectionStatus) => {
    setStatus(s);
  }, []);

  const handleSetLastUpdated = useCallback((d: Date | null) => {
    setLastUpdated(d);
  }, []);

  return (
    <AisStatusContext.Provider
      value={{
        status,
        lastUpdated,
        setStatus: handleSetStatus,
        setLastUpdated: handleSetLastUpdated,
      }}
    >
      {children}
    </AisStatusContext.Provider>
  );
}

export function useAisStatus() {
  return useContext(AisStatusContext);
}
