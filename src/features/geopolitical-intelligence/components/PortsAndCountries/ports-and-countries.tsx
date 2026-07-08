"use client";

/**
 * PortsAndCountries — Side-by-side panels for affected ports and countries
 */

import { Anchor, Globe2 } from "lucide-react";
import type { AffectedPort, AffectedCountry } from "../../types";

type PortsProps = { ports: AffectedPort[] };
type CountriesProps = { countries: AffectedCountry[] };

function PortsList({ ports }: PortsProps) {
  return (
    <section className="glass-panel p-5">
      <header className="mb-4 flex items-center gap-2.5">
        <Anchor aria-hidden className="size-4 shrink-0 text-primary/70" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Affected Ports
        </h2>
      </header>
      <ul className="space-y-2">
        {ports.map((item, i) => (
          <li
            key={i}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
          >
            <span className="block text-sm font-medium text-foreground/90">
              {item.port}
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              {item.reason}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CountriesList({ countries }: CountriesProps) {
  return (
    <section className="glass-panel p-5">
      <header className="mb-4 flex items-center gap-2.5">
        <Globe2 aria-hidden className="size-4 shrink-0 text-primary/70" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Affected Countries
        </h2>
      </header>
      <ul className="space-y-2">
        {countries.map((item, i) => (
          <li
            key={i}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
          >
            <span className="block text-sm font-medium text-foreground/90">
              {item.country}
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              {item.reason}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

type Props = {
  ports: AffectedPort[];
  countries: AffectedCountry[];
};

export function PortsAndCountries({ ports, countries }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <PortsList ports={ports} />
      <CountriesList countries={countries} />
    </div>
  );
}
