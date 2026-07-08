export function createCargoAircraftElement() {
  const root = document.createElement("div");
  root.className = "map-cargo-aircraft";

  root.innerHTML = `
    <svg class="map-cargo-aircraft__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3 9.5 9H4.5l2.8 1.8-1.8 5.7 6.5-3.5 6.5 3.5-1.8-5.7L19.5 9H14.5z"
        fill="currentColor"
      />
    </svg>
  `;

  return root;
}

export function updateCargoAircraftElement(
  element: HTMLElement,
  bearing: number,
) {
  element.style.transform = `rotate(${bearing - 90}deg)`;
}
