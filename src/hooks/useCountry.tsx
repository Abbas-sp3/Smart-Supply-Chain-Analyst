"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CountryProfile } from "@/data/countries/types";
import { COUNTRY_REGISTRY } from "@/data/countries";

interface CountryContextType {
  activeCountry: CountryProfile;
  setActiveCountryId: (id: string) => void;
  availableCountryIds: string[];
  isCountrySelected: boolean;
  clearSelection: () => void;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [activeCountryId, setActiveCountryIdState] = useState<string>("india");
  const [isCountrySelected, setIsCountrySelected] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("selected_country");
    if (stored && COUNTRY_REGISTRY[stored]) {
      setActiveCountryIdState(stored);
      setIsCountrySelected(true);
    } else {
      setIsCountrySelected(false);
    }
  }, []);

  const setActiveCountryId = (id: string) => {
    if (COUNTRY_REGISTRY[id]) {
      setActiveCountryIdState(id);
      setIsCountrySelected(true);
      localStorage.setItem("selected_country", id);
    }
  };

  const clearSelection = () => {
    setIsCountrySelected(false);
    // Note: We don't clear localStorage immediately so if they hit cancel, it's still there.
    // Or we could. Let's just leave localStorage alone until they select a new one.
  };

  // Prevent SSR mismatch by not rendering the modal state until mounted
  // But we must return a stable context to prevent downstream component crashes
  const value: CountryContextType = {
    activeCountry: COUNTRY_REGISTRY[activeCountryId] || COUNTRY_REGISTRY["india"],
    setActiveCountryId,
    availableCountryIds: Object.keys(COUNTRY_REGISTRY),
    isCountrySelected: isMounted ? isCountrySelected : true, // Hide modal during SSR
    clearSelection,
  };

  return (
    <CountryContext.Provider value={value}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (context === undefined) {
    return {
      activeCountry: COUNTRY_REGISTRY["india"]!,
      setActiveCountryId: () => {},
      availableCountryIds: Object.keys(COUNTRY_REGISTRY),
      isCountrySelected: true,
      clearSelection: () => {},
    };
  }
  return context;
}
