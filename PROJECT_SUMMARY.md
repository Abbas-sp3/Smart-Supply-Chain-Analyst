# 🌐 Project Summary & AI Onboarding Guide

Welcome to the **Smart Supply Chain Analyst** project! This document serves as the comprehensive source of truth for any developer or AI agent working on this repository. It outlines the project's purpose, architectural principles, folder responsibilities, and contains a strictly enforceable requirement for documenting AI task history.

---

## 📢 STRICTLY ENFORCEABLE RULE FOR AI AGENTS
> [!IMPORTANT]
> **Mandatory AI Task Logging Requirement:**
> After completing **any** task in this project, the AI agent **must** immediately append an entry to the [AI Task History & Change Log](#-ai-task-history--change-log) section at the bottom of this file (`PROJECT_SUMMARY.md`).
> The entry must specify the **Task Name / Goal**, **Date**, **Files Modified/Created/Deleted** (with links), and a **Brief Summary of Changes Made**. Do not skip this step!

---

## 🎯 Project Overview
**Smart Supply Chain Analyst** is an enterprise-grade Geopolitical & Energy Supply Chain Intelligence Platform. It is designed as a real-time interactive geopolitical and energy supply chain simulation and intelligence dashboard. It allows logistics analysts and risk managers to view active global energy/supply shipping lanes, assess geopolitical risks, simulate outages, track strategic reserves, and replay historical incidents.

### Key Technology Stack:
- **Core Framework:** Next.js (with TypeScript and App Router)
- **Styling:** Tailwind CSS & custom Vanilla CSS configurations
- **UI Components:** Radix UI primitives styled via Tailwind (configured via `components.json` for shadcn UI)
- **Map System:** MapLibre GL JS utilizing CARTO Dark Matter basemaps for a "live wallpaper" visual effect representing global trade flows, vessel courses, and active ports.

---

## 🏗️ Folder Structure & Component Responsibilities

The project follows a modular **Feature-Driven Architecture** under the `src/` directory. This isolates domains into highly cohesive folders and restricts cross-module dependency leaking.

```
/
├── .env.example              # Environment variables template
├── .env.local                # Local environment overrides (ignored by git)
├── components.json           # Shadcn UI configuration file
├── next.config.ts            # Next.js configuration
├── package.json              # Project dependencies and script commands
├── tsconfig.json             # TypeScript settings
├── public/                   # Static public assets (fonts, icons, etc.)
└── src/                      # Main source directory
    ├── app/                  # Next.js pages, layouts, and API routes
    ├── assets/               # Shared static assets (images, maps, SVGs)
    ├── components/           # Global design system & UI components
    │   ├── ui/               # Reusable atomic UI elements (Shadcn primitives)
    │   └── map/              # Shared map modules (ship layers, routes, overlays)
    ├── features/             # Domain-specific modular features (Self-contained)
    ├── hooks/                # Global React hooks
    ├── lib/                  # Library configurations (e.g., MapLibre/fetch clients)
    ├── services/             # General backend & mock service layers
    ├── types/                # Shared global TypeScript definitions
    └── utils/                # Pure utility functions (formatting, validation)
```

### Detailed Folder Breakdown:

#### 1. `src/app/`
- **Purpose:** Next.js App Router root containing application pages, page-specific layouts, and backend API routes.
- **Rules:** Keep pages minimal. Import and compose domain-specific features here rather than implementing features directly. All API routes under `src/app/api/` should handle proxying/mocking of external data.

#### 2. `src/components/`
- **Purpose:** Common, generic, and UI components shared across the whole project.
- **Key Subfolders:**
  - `ui/`: Houses basic reusable UI elements like buttons, dialogues, cards, and tooltips.
  - `map/`: Shared geospatial rendering layers (e.g., ports, background, animations, overlays, route markers) used to support the central MapLibre GL map container.

#### 3. `src/features/`
- **Purpose:** Domain-specific business logic and views. Highly isolated, modular packages.
- **The 7 Feature Modules:**
  - `analytics/`: Energy supply data analysis, chart visualizations, and pipeline monitoring.
  - `geopolitical-risk/`: Global hot-spot tracking, risk analysis, alert indicators, and regional threat metrics.
  - `historical-replay/`: Cargo tracking time-travel simulators to analyze previous supply chain disruptions.
  - `procurement/`: Contract management, supplier evaluation, and trade agreements.
  - `refinery/`: Oil & LNG processing flow monitors and capacity tracking.
  - `scenario-simulator/`: "What-if" routing simulation and disruption modeling (e.g., canal blockages).
  - `strategic-reserve/`: National strategic crude/gas reserves monitoring.
- **Internal Feature Structure:**
  Each feature under `src/features/<feature-name>/` must structured as follows:
  - `components/`: Feature-specific React views.
  - `hooks/`: Feature-specific custom state or data-fetching hooks.
  - `services/`: Specific API simulation, data models, or calculations.
  - `types/`: Internal domain-specific TypeScript models.
  - `constants/`: Configuration parameters or static data.
  - `index.ts`: Barrel file exporting only the public API of the feature.

#### 4. `src/hooks/`
- **Purpose:** Global, cross-domain state hooks (e.g., theme, keyboard shortcuts, screen layout).

#### 5. `src/lib/`
- **Purpose:** Initializers for third-party libraries and configurations (e.g., db clients, map initializers).

#### 6. `src/services/`
- **Purpose:** Shared data fetching layers and simulation controllers that are accessible project-wide.

#### 7. `src/types/`
- **Purpose:** Shared global domain objects (e.g., global User, MapViewport, SystemMetrics types).

#### 8. `src/utils/`
- **Purpose:** Stateless, pure utility functions (e.g., date formats, mathematical coordinates calculations, CSS class merger).

---

## 🛠️ Contribution Guidelines for AI Agents

1. **Feature Encapsulation (Barrel Exports):**
   Never cross-import files directly from another feature's internal directories. Always import via the feature's public barrel file (`src/features/<feature-name>/index.ts`).
2. **Third-Party APIs:**
   Do not call third-party APIs directly from components. Always use Next.js API routes (`src/app/api/`) as a bridge to ensure security and compliance.
3. **Vanilla CSS vs Tailwind:**
   Tailwind CSS is used for utility styling, but custom map overlays or live animations may use Vanilla CSS. Ensure changes respect existing classes.
4. **Documentation Preservation:**
   Keep comments and docstrings intact when editing code files.

---

## 📝 AI Task History & Change Log

Please record all completed tasks in this table. Add a new row at the bottom of the table on every task completion.

| Date (YYYY-MM-DD) | Task / Goal | Files Modified / Created | Summary of Work Done | Agent Identity |
| :--- | :--- | :--- | :--- | :--- |
| 2026-07-08 | Project Documentation Setup | [PROJECT_SUMMARY.md](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/PROJECT_SUMMARY.md) | Created comprehensive onboarding documentation, folder architecture mappings, and the strictly enforceable task logging rule for AI agents. | Antigravity (Gemini 3.5 Flash) |
