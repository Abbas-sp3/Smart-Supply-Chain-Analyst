# 🌐 Smart Supply Chain Analyst
> **AI-Powered Geopolitical & Supply Chain Intelligence Platform for India's Import Ecosystem**

An enterprise-grade platform that continuously monitors global geopolitical developments, maritime activity, and logistics disruptions — then uses AI to generate structured operational intelligence on how these events may impact India's imports and supply chains.

**This is NOT a news dashboard.** News is only an input. The platform displays AI-generated operational intelligence.

---

## ✨ Live Features

| Feature | Status | Description |
|:---|:---|:---|
| 🗺️ Live World Map | ✅ Live | Fixed MapLibre backdrop centred on India — shows Arabian Sea, Bay of Bengal and surrounding trade corridors. Non-interactable by design. |
| 🚢 Live AIS Vessel Tracking | ✅ Live | Real-time cargo ship positions via AISStream.io WebSocket — filtered to vessels relevant to Indian trade routes |
| 🧠 Geopolitical Intelligence Engine | ✅ Live | AI-generated supply chain intelligence: fetches live news → Groq LLM analysis → Zod-validated report → 12 structured dashboard sections |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18.x or higher
- **npm** v9.x or higher
- **Git**

### 2. Clone
```bash
git clone https://github.com/Abbas-sp3/Smart-Supply-Chain-Analyst.git
cd Smart-Supply-Chain-Analyst
```

### 3. Environment Setup
```bash
cp .env.example .env.local
```

Then fill in `.env.local`:

```env
# Live vessel tracking (required for AIS ships on map)
AISSTREAM_API_KEY=your_key         # https://aisstream.io/apikeys

# AI Intelligence Engine (required for Geopolitical Intelligence page)
GROQ_API_KEY=your_key              # https://console.groq.com/keys

# News data source (optional — embedded mock articles used as fallback)
NEWS_API_KEY=your_key              # https://newsapi.org/register
```

> **Note:** Each key has a graceful fallback. The platform runs without any keys, using mock data for the intelligence engine.

### 4. Install & Run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Project Scripts

| Command | Action |
|:---|:---|
| `npm run dev` | Start dev server on http://localhost:3000 with hot-reloading |
| `npm run build` | Production build (must pass before any PR merge) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint — must pass clean (zero errors) |

---

## 🏗️ Architecture & Project Structure

The project follows a **Feature-Driven Architecture** — each domain is a self-contained module under `src/features/`.

```
src/
├── app/
│   ├── api/
│   │   ├── intelligence/     # GET /api/intelligence  — AI report generation
│   │   └── ships/            # GET /api/ships         — Live AIS vessel data
│   ├── geopolitical-risk/    # /geopolitical-risk page
│   └── layout.tsx / globals.css
│
├── components/
│   ├── app-shell/            # Root layout (DO NOT MODIFY)
│   ├── app-main-content/     # Map + content overlay layout
│   ├── map/                  # MapLibre map system
│   │   ├── world-map/        # Map initialisation & interaction config
│   │   ├── background/       # Animated ship/aircraft/route layers
│   │   └── ships/            # Live AIS ship marker layer
│   └── ui/                   # Shadcn UI primitives
│
├── features/
│   ├── geopolitical-intelligence/   # ✅ IMPLEMENTED
│   │   ├── types/            # TypeScript types (IntelligenceReport, etc.)
│   │   ├── schemas/          # Zod validation schema
│   │   ├── constants/        # Keywords, TTL, model config
│   │   ├── prompts/          # System prompt & user prompt builder
│   │   ├── services/
│   │   │   ├── newsService.ts       # NewsAPI fetch + mock fallback
│   │   │   ├── groqService.ts       # Groq LLM communication (only file using groq-sdk)
│   │   │   └── intelligenceService.ts  # Orchestration + 30min cache
│   │   ├── hooks/            # useIntelligence() data hook
│   │   ├── components/       # 12 display components (no raw news ever shown)
│   │   └── index.ts          # Public API surface
│   │
│   ├── analytics/            # (stub)
│   ├── historical-replay/    # (stub)
│   ├── procurement/          # (stub)
│   ├── refinery/             # (stub)
│   ├── scenario-simulator/   # (stub)
│   └── strategic-reserve/    # (stub)
│
├── lib/
│   ├── aisstream/            # AIS WebSocket manager, filters, normalizer
│   ├── maplibre/             # MapLibre config, options, interaction control
│   └── constants/            # Navigation, layout panel registry
│
└── types/                    # Global shared TypeScript models
```

---

## 🧠 Intelligence Engine Architecture

```
Browser → GET /geopolitical-risk
  → useIntelligence() hook → GET /api/intelligence
    → intelligenceService (30min cache)
      → newsService.fetch()        (NewsAPI or 10 curated mock articles)
      → buildUserPrompt(articles)
      → groqService.callGroq()     (llama-3.3-70b-versatile)
      → JSON.parse() + Zod.parse() (full schema validation)
      → IntelligenceReport
    → 12 frontend sections rendered
       (Executive Summary, Key Developments, Why India Should Care,
        Affected Categories, Affected Products, Trade Corridors,
        Ports, Countries, Industries, Supply Chain Impacts,
        Alternative Sourcing, Recommendations, Evidence Citations)
```

**Key design decisions:**
- Users **never** see raw news articles — only AI-structured intelligence
- Recommendations use **qualitative language only** (no fake percentages)
- `DataSourcePlugin` interface allows future sources (AIS, commodity prices, weather, sanctions DB) to be plugged in without touching the frontend
- In-memory cache deduplicates concurrent requests and avoids hammering Groq

---

## 🗺️ Map System

The world map is a **fixed, non-interactive backdrop** centred on India (78.96°E, 20.59°N) at zoom 3.8. It shows:
- India's country label
- Arabian Sea and Bay of Bengal
- Surrounding trade corridor geography
- Animated simulated cargo routes (background layer)
- Live AIS vessel positions (when `AISSTREAM_API_KEY` is set)

All map interactions (scroll, pan, zoom, drag, keyboard) are disabled at both the MapLibre handler level and the CSS level so page scroll always works correctly.

---

## 🤝 Contribution Guidelines

1. **Architecture First**: All new capabilities go under `src/features/<feature-name>/` — never add logic directly to `src/app/` pages.
2. **Public APIs Only**: Never cross-import non-exported internals from another feature. Use the feature's `index.ts` barrel file.
3. **API Routes Only**: Never call third-party APIs (AIS, news, Groq, weather) from React components. Route everything through `src/app/api/`.
4. **No Frontend Redesign**: Do not modify `AppShell`, `AppSidebar`, `AppHeader`, or `WorldMap` without explicit approval.
5. **Build & Lint Must Pass**: `npm run build` and `npm run lint` must both pass clean before any commit.
6. **Document Changes**: Update `.agents/docs/PROJECT_SUMMARY.md` with your task entry after any significant change.
7. **No Fake Data in Intelligence**: Recommendations must never contain specific percentages. Use qualitative language.

---

## 📂 AI Agent Onboarding

> If you are an AI coding assistant working on this repository, read this first:
>
> The single source of truth for project architecture, task history, and AI-specific rules is located at:
>
> **`.agents/docs/PROJECT_SUMMARY.md`**
>
> Read it before making any changes.
