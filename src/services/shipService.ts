import type { ShipsResponse } from "@/types/ship";

const UNAVAILABLE_MESSAGE = "No live vessel data available";

export async function getShips(): Promise<ShipsResponse> {
  try {
    const response = await fetch("/api/ships", {
      cache: "no-store",
    });

    if (!response.ok) {
      return { ships: [], message: UNAVAILABLE_MESSAGE };
    }

    const data = (await response.json()) as ShipsResponse;

    return {
      ships: data.ships ?? [],
      message: data.message,
    };
  } catch {
    return { ships: [], message: UNAVAILABLE_MESSAGE };
  }
}
