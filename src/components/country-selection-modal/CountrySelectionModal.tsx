"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCountry } from "@/hooks/useCountry";
import { COUNTRY_REGISTRY } from "@/data/countries";
import { Globe2 } from "lucide-react";

export function CountrySelectionModal() {
  const { isCountrySelected, setActiveCountryId, availableCountryIds } = useCountry();

  return (
    <AnimatePresence>
      {!isCountrySelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-black/60 shadow-2xl p-6 md:p-8 relative"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            
            <div className="flex flex-col items-center text-center mb-8">
              <div className="size-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Globe2 className="size-6 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                Select Operating Region
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose a country context to configure the intelligence pipeline, supply chain models, and map visuals.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableCountryIds.map((id) => {
                const profile = COUNTRY_REGISTRY[id];
                if (!profile) return null;
                
                return (
                  <button
                    key={id}
                    onClick={() => setActiveCountryId(id)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 transition-all text-left group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-3xl filter drop-shadow-md">{profile.flag || "🌍"}</span>
                    <div>
                      <div className="font-semibold text-white/90 group-hover:text-white transition-colors">
                        {profile.name}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                        Active Profile
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
