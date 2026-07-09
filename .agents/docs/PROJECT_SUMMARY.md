# 🌐 Project Summary & AI Onboarding Guide

Welcome to the **Smart Supply Chain Analyst** project! This document serves as the comprehensive source of truth for any developer or AI agent working on this repository. It outlines the project's purpose, architectural principles, folder responsibilities, and contains a strictly enforceable requirement for documenting AI task history.

---

## 📢 STRICTLY ENFORCEABLE RULE FOR AI AGENTS
> [!IMPORTANT]
> **Mandatory AI Task Logging Requirement:**
> After completing **any** task in this project, the AI agent **must** immediately append an entry to the [AI Task History & Change Log](#-ai-task-history--change-log) section at the bottom of this file.
> The file is located at: **`.agents/docs/PROJECT_SUMMARY.md`**
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
| 2026-07-08 | Increase Ship & Plane Counts & Prevent Clutter | [aircraft-layer.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/components/map/background/aircraft/aircraft-layer.ts), [ships-layer.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/components/map/background/ships/ships-layer.ts) | Increased cargo plane counts from 1 to 4 per route, cargo ship counts to ~44 total, and adjusted random stagger bounds to prevent visual clustering/bunching on paths. | Antigravity (Gemini 3.5 Flash) |
| 2026-07-08 | Live AIS Stream & Dynamic Ship Toggling | [manager.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/lib/aisstream/manager.ts), [ship-layer.tsx](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/components/map/ships/ShipLayer/ship-layer.tsx), [map-workspace-layer.tsx](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/components/map/world-map/map-workspace-layer.tsx) | Filtered live AIS stream to cargo/tankers relevant to Indian trade; dynamically toggle the simulated background ship layer based on live ship availability; mounted the live ShipLayer. | Antigravity (Gemini 3.5 Flash) |
| 2026-07-09 | Geopolitical & Supply Chain Intelligence Engine | [types/index.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/types/index.ts), [schemas/intelligence.schema.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/schemas/intelligence.schema.ts), [constants/index.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/constants/index.ts), [prompts/system.prompt.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/prompts/system.prompt.ts), [services/newsService.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/services/newsService.ts), [services/groqService.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/services/groqService.ts), [services/intelligenceService.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/services/intelligenceService.ts), [app/api/intelligence/route.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/app/api/intelligence/route.ts), 12 frontend components, [hooks/useIntelligence.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/hooks/useIntelligence.ts), [app/geopolitical-risk/page.tsx](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/app/geopolitical-risk/page.tsx), [navigation.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/lib/constants/navigation.ts) | Implemented the full Geopolitical & Supply Chain Intelligence Engine. Architecture: NewsAPI → deduplication → AI prompt → Groq (llama-3.3-70b-versatile) → Zod validation → typed IntelligenceReport → 12 frontend display sections. GROQ_API_KEY and NEWS_API_KEY added to env. Mock article fallback for no NewsAPI key. DataSourcePlugin interface designed for future pluggability (AIS, commodity prices, weather, etc.). npm run build and npm run lint both pass clean. | Antigravity (Claude Sonnet 4.6) |
| 2026-07-09 | Map: Fixed to India, Non-Interactive, Scroll Fix | [config.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/lib/maplibre/config.ts), [options.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/lib/maplibre/options.ts), [app-main-content.tsx](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/components/app-main-content/app-main-content.tsx), [globals.css](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/app/globals.css) | Centred map on India (78.96°E, 20.59°N) at zoom 3.8 so INDIA label is visible. Disabled all map interactions (scrollZoom, dragPan, doubleClickZoom, keyboard, touchZoomRotate). Fixed scroll stealing: content overlay changed from pointer-events-none to pointer-events-auto so page scroll works correctly. | Antigravity (Claude Sonnet 4.6) |
| 2026-07-09 | README Update, PROJECT_SUMMARY Relocation | [README.md](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/README.md), [.agents/docs/PROJECT_SUMMARY.md](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/.agents/docs/PROJECT_SUMMARY.md) | Rewrote README with full feature list, intelligence engine architecture diagram, env setup guide, contribution rules, and AI onboarding pointer. Moved PROJECT_SUMMARY.md from root to .agents/docs/PROJECT_SUMMARY.md (hidden from casual browsing, but tracked in git for devs and AI agents). | Antigravity (Claude Sonnet 4.6) |
| 2026-07-09 | Intelligence Fusion Engine Extension | [openSkyService.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/services/openSkyService.ts), [aisIntelligenceService.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/services/aisIntelligenceService.ts), [indiaTradeGraph.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/knowledge-graph/indiaTradeGraph.ts), [intelligence-dashboard.tsx](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/components/IntelligenceDashboard/intelligence-dashboard.tsx) | Implemented OpenSky Network plugin for military aviation monitoring. Implemented AISStream intelligence plugin for commercial maritime monitoring (reusing existing WebSocket). Added static India Trade Knowledge Graph to provide strategic dependency context to the AI prompt. Expanded Zod schema and system prompt to support 20 intelligence dimensions. Created 8 new frontend components to render the expanded operational intelligence dashboard. | Antigravity (Gemini 3.1 Pro) |
| 2026-07-09 | OpenSky OAuth Migration | [openSkyService.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/services/openSkyService.ts), [.env.local](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/.env.local), [.env.example](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/.env.example) | Switched OpenSky Network authentication from Basic Auth (username/password) to OAuth API Client flow (client_id/client_secret) as requested. Updated the service to fetch and cache the Bearer access token automatically. | Antigravity (Gemini 3.1 Pro) |
| 2026-07-09 | Intelligence Preprocessing Pipeline Redesign | [types/index.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/types/index.ts), [preprocessingService.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/services/preprocessingService.ts), [newsService.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/services/newsService.ts), [openSkyService.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/services/openSkyService.ts), [aisIntelligenceService.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/services/aisIntelligenceService.ts), [system.prompt.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/prompts/system.prompt.ts), [intelligenceService.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/services/intelligenceService.ts) | Designed and implemented a robust preprocessing pipeline for the Intelligence Engine. Replaced naive data appending with a multi-step pipeline: Raw Data Extraction → Normalization → Deduplication → LLM-assisted Fact Extraction → Knowledge Graph Augmentation → Relevance Filtering. Reduced Groq system prompt from >1000 words to <500 words, drastically dropping token consumption and improving inference latency. | Antigravity (Gemini 3.1 Pro) |
| 2026-07-09 | Intelligence Prioritization Layer | [preprocessingService.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/services/preprocessingService.ts), [indiaTradeGraph.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/knowledge-graph/indiaTradeGraph.ts), [system.prompt.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/prompts/system.prompt.ts), [intelligence-dashboard.tsx](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/components/IntelligenceDashboard/intelligence-dashboard.tsx) | Shifted engine behavior from "news summarizer" to "Supply Chain Intelligence Officer." Added rule-based Prioritization Engine tagging events with CRITICAL to BACKGROUND priority based on strategic chokepoints and commodities. Expanded Knowledge Graph to include multi-step dependency chains (e.g., Hormuz → Oil → Fuel). Reordered dashboard rendering to prioritize operational threats. | Antigravity (Gemini 3.1 Pro) |
| 2026-07-09 | Multi-Model Architecture & Token Optimization | [groqService.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/services/groqService.ts), [preprocessingService.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/services/preprocessingService.ts), [constants/index.ts](file:///c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/constants/index.ts) | Resolved TPM rate limit errors. Upgraded `groqService` to support model switching. Offloaded Fact Extraction LLM call to the much faster `llama-3.1-8b-instant` to preserve TPM quota, and strictly reserved `llama-3.3-70b-versatile` for final reasoning. Lowered `GROQ_MAX_TOKENS` from 8192 to 4096 to bypass token provisioning caps. | Antigravity (Gemini 3.1 Pro) |
