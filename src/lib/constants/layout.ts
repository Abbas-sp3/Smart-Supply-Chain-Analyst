export type WorkspacePanel = {
  id: string;
  title: string;
  placeholder: string;
};

export const WORKSPACE_PANELS: WorkspacePanel[] = [
  {
    id: "panel-alpha",
    title: "Energy Supply Overview",
    placeholder: "Real-time energy supply flows and import dependency metrics.",
  },
  {
    id: "panel-beta",
    title: "Energy Price Monitor",
    placeholder: "Live energy commodity prices and price trend indicators.",
  },
  {
    id: "panel-gamma",
    title: "Energy Corridor Watch",
    placeholder: "Chokepoint monitoring for energy transit corridors and sea lanes.",
  },
  {
    id: "panel-delta",
    title: "Import Dependency Metrics",
    placeholder: "Import dependency ratios for key energy commodities.",
  },
];

export const SIDEBAR_WIDTH_EXPANDED = "15rem";
export const SIDEBAR_WIDTH_COLLAPSED = "4rem";
