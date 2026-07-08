export type WorkspacePanel = {
  id: string;
  title: string;
  placeholder: string;
};

export const WORKSPACE_PANELS: WorkspacePanel[] = [
  {
    id: "panel-alpha",
    title: "Panel Alpha",
    placeholder: "Placeholder content for operational panel alpha.",
  },
  {
    id: "panel-beta",
    title: "Panel Beta",
    placeholder: "Placeholder content for operational panel beta.",
  },
  {
    id: "panel-gamma",
    title: "Panel Gamma",
    placeholder: "Placeholder content for operational panel gamma.",
  },
  {
    id: "panel-delta",
    title: "Panel Delta",
    placeholder: "Placeholder content for operational panel delta.",
  },
];

export const SIDEBAR_WIDTH_EXPANDED = "15rem";
export const SIDEBAR_WIDTH_COLLAPSED = "4rem";
