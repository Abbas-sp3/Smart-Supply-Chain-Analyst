export type CorridorStatus = {
  corridorName: string;
  status: "CRITICAL" | "ELEVATED" | "NORMAL" | "NO_SIGNAL";
  updatedAt: number;
};

const bus: { corridorStatus: CorridorStatus | null } = { corridorStatus: null };

export function writeCorridorStatus(status: Omit<CorridorStatus, "updatedAt">): void {
  bus.corridorStatus = { ...status, updatedAt: Date.now() };
}

export function readCorridorStatus(maxAgeMs = 300_000): CorridorStatus | null {
  if (!bus.corridorStatus) return null;
  if (Date.now() - bus.corridorStatus.updatedAt > maxAgeMs) return null;
  return bus.corridorStatus;
}
