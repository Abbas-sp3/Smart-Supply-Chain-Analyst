import WebSocket from "ws";

import type { Ship, ShipsResponse } from "@/types/ship";

import {
  AIS_SUBSCRIPTION_BOUNDING_BOXES,
  MAX_RETURNED_SHIPS,
} from "./constants";
import { matchesIndiaEnergyCorridorFilter, sortByRecency } from "./filters";
import type { AisEnvelope, VesselCacheEntry } from "./normalize";
import {
  resolveCountryFromMmsi,
  resolveHeading,
  resolveShipType,
  sanitizeDestination,
  sanitizeName,
} from "./normalize";

const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";
const UNAVAILABLE_MESSAGE = "No live vessel data available";
const RECONNECT_DELAY_MS = 5_000;

type GlobalAisState = typeof globalThis & {
  __aisStreamManager?: AisStreamManager;
};

class AisStreamManager {
  private socket: WebSocket | null = null;
  private connecting = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly vessels = new Map<string, VesselCacheEntry>();
  private lastMessageAt: number | null = null;
  private serviceError: string | null = null;

  getShips(): ShipsResponse {
    this.ensureConnection();

    if (!process.env.AISSTREAM_API_KEY) {
      return { ships: [], message: UNAVAILABLE_MESSAGE };
    }

    if (this.serviceError) {
      return { ships: [], message: UNAVAILABLE_MESSAGE };
    }

    const ships = sortByRecency(
      Array.from(this.vessels.values())
        .map((entry) => this.toShip(entry))
        .filter((ship): ship is Ship => ship !== null)
        .filter((ship) =>
          matchesIndiaEnergyCorridorFilter({
            latitude: ship.latitude,
            longitude: ship.longitude,
            destination: ship.destination,
          }),
        ),
    ).slice(0, MAX_RETURNED_SHIPS);

    if (ships.length === 0 && !this.lastMessageAt) {
      return { ships: [], message: UNAVAILABLE_MESSAGE };
    }

    return { ships };
  }

  private ensureConnection() {
    if (this.socket?.readyState === WebSocket.OPEN || this.connecting) {
      return;
    }

    const apiKey = process.env.AISSTREAM_API_KEY;

    if (!apiKey) {
      this.serviceError = UNAVAILABLE_MESSAGE;
      return;
    }

    this.connecting = true;
    this.serviceError = null;

    const socket = new WebSocket(AISSTREAM_URL);
    this.socket = socket;

    socket.on("open", () => {
      this.connecting = false;
      socket.send(
        JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: AIS_SUBSCRIPTION_BOUNDING_BOXES,
          FilterMessageTypes: ["PositionReport", "ShipStaticData"],
        }),
      );
    });

    socket.on("message", (raw) => {
      this.handleMessage(raw.toString());
    });

    socket.on("error", () => {
      this.serviceError = UNAVAILABLE_MESSAGE;
    });

    socket.on("close", () => {
      this.connecting = false;
      this.socket = null;
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || !process.env.AISSTREAM_API_KEY) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.ensureConnection();
    }, RECONNECT_DELAY_MS);
  }

  private handleMessage(raw: string) {
    let envelope: AisEnvelope;

    try {
      envelope = JSON.parse(raw) as AisEnvelope;
    } catch {
      return;
    }

    if (envelope.error) {
      this.serviceError = UNAVAILABLE_MESSAGE;
      return;
    }

    const messageType = envelope.MessageType;
    const mmsi = String(
      envelope.MetaData?.MMSI ??
        envelope.Message?.[messageType ?? ""]?.UserID ??
        "",
    );

    if (!mmsi) {
      return;
    }

    const existing = this.vessels.get(mmsi) ?? {
      mmsi,
      updatedAt: Date.now(),
    };

    if (messageType === "PositionReport") {
      const report = envelope.Message?.PositionReport;

      if (!report) {
        return;
      }

      const latitude = Number(report.Latitude ?? envelope.MetaData?.latitude);
      const longitude = Number(
        report.Longitude ?? envelope.MetaData?.longitude,
      );

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return;
      }

      existing.latitude = latitude;
      existing.longitude = longitude;
      existing.heading = resolveHeading(
        report.TrueHeading,
        report.Cog,
      );
      existing.speed = Number(report.Sog ?? 0);
      existing.timestamp =
        envelope.MetaData?.time_utc ?? new Date().toISOString();
      existing.name = sanitizeName(
        envelope.MetaData?.ShipName,
        existing.name ?? `MMSI ${mmsi}`,
      );
    }

    if (messageType === "ShipStaticData") {
      const staticData = envelope.Message?.ShipStaticData;

      if (!staticData) {
        return;
      }

      existing.name = sanitizeName(staticData.Name, existing.name ?? `MMSI ${mmsi}`);
      existing.imo = staticData.ImoNumber
        ? String(staticData.ImoNumber)
        : existing.imo ?? "";
      existing.destination = sanitizeDestination(staticData.Destination);
      existing.shipType = resolveShipType(staticData.Type);
      existing.country =
        existing.country || resolveCountryFromMmsi(mmsi);
    }

    existing.updatedAt = Date.now();
    existing.country = existing.country || resolveCountryFromMmsi(mmsi);
    this.vessels.set(mmsi, existing);
    this.lastMessageAt = Date.now();
    this.serviceError = null;
  }

  private toShip(entry: VesselCacheEntry): Ship | null {
    if (
      typeof entry.latitude !== "number" ||
      typeof entry.longitude !== "number"
    ) {
      return null;
    }

    return {
      id: entry.mmsi,
      name: entry.name ?? `MMSI ${entry.mmsi}`,
      imo: entry.imo ?? "",
      mmsi: entry.mmsi,
      latitude: entry.latitude,
      longitude: entry.longitude,
      heading: entry.heading ?? 0,
      speed: entry.speed ?? 0,
      destination: entry.destination ?? "",
      shipType: entry.shipType ?? "Unknown",
      country: entry.country ?? "",
      timestamp: entry.timestamp ?? new Date(entry.updatedAt).toISOString(),
    };
  }
}

const globalForAis = globalThis as GlobalAisState;

export const aisStreamManager =
  globalForAis.__aisStreamManager ?? new AisStreamManager();

if (process.env.NODE_ENV !== "production") {
  globalForAis.__aisStreamManager = aisStreamManager;
}
