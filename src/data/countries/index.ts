/**
 * countries/index.ts — Country registry
 *
 * Add new countries here. COUNTRY_REGISTRY is the single source of truth
 * used by all services (API routes, RAG, intelligence pipeline).
 *
 * To add a new country:
 *  1. Copy _template.ts → <country_id>.ts
 *  2. Fill in all fields
 *  3. Import below and add to COUNTRY_REGISTRY
 *  4. Run: npx tsx testCountryIsolation.ts india <country_id>
 */

import type { CountryProfile } from "./types";
import { indiaProfile } from "./india";
import { singaporeProfile } from "./singapore";

export const COUNTRY_REGISTRY: Record<string, CountryProfile> = {
  india: indiaProfile,
  singapore: singaporeProfile,
};

export { indiaProfile, singaporeProfile };
