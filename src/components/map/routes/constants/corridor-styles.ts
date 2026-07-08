import type { CorridorStatus } from "./energy-corridors";

export const CORRIDOR_LINE_COLORS: Record<CorridorStatus, string> = {
  normal: "#64748b",
  selected: "#22d3ee",
  disrupted: "#fbbf24",
  closed: "#ef4444",
};

export const CORRIDOR_LINE_WIDTH = 0.85;
export const CORRIDOR_LINE_OPACITY = 0.62;
