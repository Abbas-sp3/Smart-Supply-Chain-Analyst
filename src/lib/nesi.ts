export type AlertSeverity = "Critical" | "High" | "Medium" | "Low";

export interface NesiComponents {
  grf: number;
  srf: number;
  scrf: number;
  nesi: number;
}

export function calculateGrf(alerts: { severity: AlertSeverity }[]): number {
  let penalty = 0;
  for (const alert of alerts) {
    if (alert.severity === "Critical") penalty += 15;
    else if (alert.severity === "High") penalty += 10;
    else if (alert.severity === "Medium") penalty += 5;
    else if (alert.severity === "Low") penalty += 2;
  }
  return Math.max(0, 100 - penalty);
}

export function calculateSrf(currentFillMmt: number, totalCapacityMmt: number): number {
  if (totalCapacityMmt === 0) return 0;
  return Math.min(100, Math.max(0, (currentFillMmt / totalCapacityMmt) * 100));
}

export function calculateNesi(grf: number, srf: number, scrf: number): NesiComponents {
  // Weights: GRF (35%), SRF (35%), ScRF (30%)
  const nesi = (grf * 0.35) + (srf * 0.35) + (scrf * 0.30);
  return {
    grf: Math.round(grf),
    srf: Math.round(srf),
    scrf: Math.round(scrf),
    nesi: Math.round(nesi)
  };
}
