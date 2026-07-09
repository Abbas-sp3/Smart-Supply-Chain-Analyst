import type { DataSourceOutput, DataSourcePlugin } from "../types";
import { aisStreamManager } from "@/lib/aisstream/manager";

const MOCK_MARITIME_DATA = `
MOCK MARITIME INTELLIGENCE (No AIS data or no key):
- Detected high concentration of crude oil tankers idling near the Strait of Hormuz.
- Observed route deviations by major container lines away from the Red Sea, adding ~12 days to Europe-India transit.
- Port of Singapore showing elevated congestion levels, likely delaying trans-shipment cargo to Indian east coast ports.
`;

class AisIntelligenceServicePlugin implements DataSourcePlugin {
  readonly name = "AIS Maritime Intelligence";

  async fetch(): Promise<DataSourceOutput[]> {
    if (!process.env.AISSTREAM_API_KEY) {
      console.log("[aisIntelligenceService] Missing credentials, using mock data.");
      return [
        {
          source: this.name,
          data: { type: "maritime_ais", count: 0, shipTypes: {}, mockData: MOCK_MARITIME_DATA },
        },
      ];
    }

    try {
      const response = aisStreamManager.getShips();
      const ships = response.ships;

      if (!ships || ships.length === 0) {
        return [
          {
            source: this.name,
            data: { type: "maritime_ais", count: 0, shipTypes: {} },
          },
        ];
      }

      const totalShips = ships.length;
      
      const shipTypes = ships.reduce((acc, ship) => {
        acc[ship.shipType] = (acc[ship.shipType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return [
        {
          source: this.name,
          data: {
            type: "maritime_ais",
            count: totalShips,
            shipTypes,
            mockData: MOCK_MARITIME_DATA,
          },
        },
      ];
    } catch (error) {
      console.error("[aisIntelligenceService] Fetch failed:", error);
      return [
        {
          source: this.name,
          data: { type: "maritime_ais", count: 0, shipTypes: {}, mockData: MOCK_MARITIME_DATA },
        },
      ];
    }
  }
}

export const aisIntelligenceDataSource = new AisIntelligenceServicePlugin();
