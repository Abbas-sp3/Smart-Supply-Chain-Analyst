import type { Ship } from "@/types/ship";

export function createShipMarkerElement() {
  const root = document.createElement("div");
  root.className = "map-live-ship";

  root.innerHTML = `
    <svg class="map-live-ship__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2 14.5 7.5 11.5 12 12.5 17 10.5 21 12v2.5H2z"
        fill="currentColor"
      />
      <path
        d="M7.5 11.5V9l4.5-1.5L16 9v2.5"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
        stroke-linejoin="round"
      />
    </svg>
  `;

  return root;
}

export function updateShipMarkerElement(element: HTMLElement, heading: number) {
  const normalizedHeading = heading >= 0 && heading <= 360 ? heading : 0;
  element.style.transform = `rotate(${normalizedHeading}deg)`;
}

export function formatHeading(heading: number) {
  if (heading < 0 || heading > 360) {
    return "N/A";
  }

  return `${Math.round(heading)}°`;
}

export function formatSpeed(speed: number) {
  return `${speed.toFixed(1)} kn`;
}

export function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toUTCString();
}

export function buildShipPopupContent(ship: Ship) {
  return `
    <div class="map-ship-popup">
      <p class="map-ship-popup__title">${ship.name}</p>
      <dl class="map-ship-popup__list">
        <div><dt>Type</dt><dd>${ship.shipType}</dd></div>
        <div><dt>Destination</dt><dd>${ship.destination || "—"}</dd></div>
        <div><dt>Speed</dt><dd>${formatSpeed(ship.speed)}</dd></div>
        <div><dt>Heading</dt><dd>${formatHeading(ship.heading)}</dd></div>
        <div><dt>Last Update</dt><dd>${formatTimestamp(ship.timestamp)}</dd></div>
      </dl>
    </div>
  `;
}
