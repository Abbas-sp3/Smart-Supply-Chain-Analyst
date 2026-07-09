import type { DataSourceOutput, DataSourcePlugin } from "../types";

const OPENSKY_URL = "https://opensky-network.org/api/states/all";
const OPENSKY_TOKEN_URL = "https://opensky-network.org/api/auth/token"; // Standard OAuth token endpoint

// Approximate bounding box covering Middle East / Arabian Sea / Indian Ocean
const REGION_BBOX = {
  lamin: 0,
  lamax: 35,
  lomin: 40,
  lomax: 80,
};

const MOCK_MILITARY_DATA = `
MOCK MILITARY AVIATION INTELLIGENCE (Credentials missing or API failed):
- Detected 3x C-17 Globemaster III transports en route near the Strait of Hormuz (heading SE).
- Detected 2x IL-76 logistics aircraft operating near the Red Sea.
- Detected 1x KC-135 aerial refueling tanker loitering over the Arabian Sea.
Note: Military movement alone is one signal among many and must not trigger conclusions independently.
`;

// Token management state
let cachedAccessToken: string | null = null;
let tokenExpiryTimeMs = 0;

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  // Return cached token if valid and not expiring within the next 60 seconds
  if (cachedAccessToken && Date.now() < tokenExpiryTimeMs - 60000) {
    return cachedAccessToken;
  }

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);

  const response = await fetch(OPENSKY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`OpenSky OAuth error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  
  if (!data.access_token) {
    throw new Error("Invalid response from OpenSky OAuth: missing access_token");
  }

  cachedAccessToken = data.access_token;
  // default to 1 hour if expires_in is missing, otherwise calculate expiry
  tokenExpiryTimeMs = Date.now() + (data.expires_in ? data.expires_in * 1000 : 3600 * 1000);

  return cachedAccessToken;
}

class OpenSkyDataSourcePlugin implements DataSourcePlugin {
  readonly name = "OpenSky Network (Military Logistics)";

  async fetch(): Promise<DataSourceOutput[]> {
    const clientId = process.env.OPENSKY_CLIENT_ID;
    const clientSecret = process.env.OPENSKY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.log("[openSkyService] Missing OAuth credentials, using mock data.");
      return [
        {
          source: this.name,
          data: { type: "military_aviation", count: 0, states: [], mockData: MOCK_MILITARY_DATA },
        },
      ];
    }

    try {
      const accessToken = await getAccessToken(clientId, clientSecret);

      const url = new URL(OPENSKY_URL);
      url.searchParams.append("lamin", REGION_BBOX.lamin.toString());
      url.searchParams.append("lamax", REGION_BBOX.lamax.toString());
      url.searchParams.append("lomin", REGION_BBOX.lomin.toString());
      url.searchParams.append("lomax", REGION_BBOX.lomax.toString());
      
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        // We don't want to hit OpenSky too aggressively, they have strict rate limits
        next: { revalidate: 300 }, 
      });

      if (!response.ok) {
        throw new Error(`OpenSky API error: ${response.status}`);
      }

      const data = (await response.json()) as { states: unknown[][] | null };
      
      if (!data.states || data.states.length === 0) {
        return [
          {
             source: this.name,
             data: { type: "military_aviation", count: 0, states: [] },
          }
        ];
      }

      // Map raw states to a simplified structure to pass to the Fact Extractor
      const mappedStates = data.states.map((state) => ({
        icao24: String(state[0]),
        callsign: String(state[1]).trim(),
        origin_country: String(state[2]),
        longitude: Number(state[5]),
        latitude: Number(state[6]),
        altitude: Number(state[7]),
        velocity: Number(state[9]),
      }));

      return [
        {
          source: this.name,
          data: {
            type: "military_aviation",
            count: mappedStates.length,
            states: mappedStates,
            mockData: MOCK_MILITARY_DATA, // pass along mock data for testing/demo purposes
          },
        },
      ];

    } catch (error) {
      console.error("[openSkyService] Fetch failed:", error);
      return [
        {
          source: this.name,
          data: { type: "military_aviation", count: 0, states: [], mockData: MOCK_MILITARY_DATA },
        },
      ];
    }
  }
}

export const openSkyDataSource = new OpenSkyDataSourcePlugin();
