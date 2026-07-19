<div align="center">

<br />

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ███████╗███████╗ ██████╗ █████╗                          ║
║     ██╔════╝██╔════╝██╔════╝██╔══██╗                         ║
║     ███████╗███████╗██║     ███████║                         ║
║     ╚════██║╚════██║██║     ██╔══██║                         ║
║     ███████║███████║╚██████╗██║  ██║                         ║
║     ╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝                         ║
║                                                               ║
║         Smart Supply Chain Analyst                            ║
║         India's Import Intelligence Platform                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Groq](https://img.shields.io/badge/Groq-AI_Engine-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
[![MapLibre](https://img.shields.io/badge/MapLibre-5-396CB2?style=for-the-badge&logo=mapbox&logoColor=white)](https://maplibre.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<br />

**A real-time supply chain intelligence platform for India's import ecosystem.**  
Tracking global trade corridors, geopolitical risk, maritime activity, refinery operations,  
and procurement intelligence — all fused into a single enterprise-grade dashboard.

<br />

</div>

---

## What It Does

SSCA monitors every layer of India's import supply chain simultaneously. When a conflict breaks out near the Strait of Hormuz, a cyclone hits a major port, or China restricts rare earth exports, the platform instantly traces the ripple effect across India's energy, pharma, electronics, and agriculture sectors — and recommends what to do about it.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INTELLIGENCE FLOW                                │
│                                                                     │
│  Global Events ──► Signal Collection ──► AI Reasoning Engine        │
│                                               │                     │
│   • News feeds         • NewsAPI              │  Groq LLaMA 3.1    │
│   • AIS maritime       • AISStream            │  + Gemini fallback  │
│   • Military aviation  • OpenSky Network      │                     │
│                               │               ▼                     │
│                        Knowledge Graph   5 Parallel Modules         │
│                        (100+ trade       ┌──────────────────┐       │
│                         nodes)           │ Executive Summary│       │
│                               │          │ Supply Chain Map │       │
│                               ▼          │ Recommendations  │       │
│                        Structured        │ Scenario Analysis│       │
│                        Context           │ Evidence & Intel │       │
│                                          └──────────────────┘       │
│                                                 │                   │
│                                                 ▼                   │
│                                    Unified Intelligence Report      │
│                                    (Validated, Gap-Filled, Served)  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Platform Modules

```
┌──────────────────┬───────────────────┬───────────────────┬──────────────────┐
│                  │                   │                   │                  │
│  🌍 GEOPOLITICAL │  🗺️  LIVE MAP      │  📊 ANALYTICS     │  🔬 REFINERY     │
│   INTELLIGENCE   │                   │                   │   MONITOR        │
│                  │  Real-time AIS    │  Historical trade │                  │
│  Tracks global   │  vessel tracking  │  flow charts,     │  Tracks India's  │
│  events and      │  overlaid on a    │  commodity price  │  refinery        │
│  reasons through │  geopolitical     │  trends, and      │  capacity,       │
│  their impact    │  risk map of      │  corridor health  │  throughput,     │
│  on India's      │  India's trade    │  indices          │  and crude       │
│  imports         │  corridors                            │  intake          │
│                  │                   │                   │                  │
├──────────────────┼───────────────────┼───────────────────┼──────────────────┤
│                  │                   │                   │                  │
│  📦 PROCUREMENT  │  🛢️  STRATEGIC     │  🎮 SCENARIO      │  ⚡ REAL-TIME    │
│   INTELLIGENCE   │   RESERVE         │   SIMULATOR       │   ALERTS         │
│                  │                   │                   │                  │
│  Tracks supplier │  Monitors India's │  Model disruption │  Live event feed │
│  risk, contract  │  strategic oil,   │  scenarios:       │  with priority   │
│  exposure, and   │  food, and        │  port closure,    │  classification  │
│  sourcing        │  critical mineral │  sanctions, route │  and supply      │
│  alternatives    │  reserve levels   │  deviation        │  chain impact    │
│                  │                   │                   │                  │
└──────────────────┴───────────────────┴───────────────────┴──────────────────┘
```

---

## Geopolitical Intelligence Engine

The core of the platform. It reasons like a senior analyst — not a news aggregator.

```
INPUT SOURCES
─────────────
NewsAPI ──────────────────────┐
AISStream (Maritime) ─────────┤──► Fact Extraction (LLaMA 3.1 8B)
OpenSky (Military Aviation) ──┘               │
                                              │
                                              ▼
                              ┌───────────────────────────┐
                              │   KNOWLEDGE GRAPH ENGINE   │
                              │                           │
                              │  100+ trade nodes         │
                              │  30+ source countries     │
                              │  20+ critical products    │
                              │  12 Indian ports          │
                              │  7 strategic corridors    │
                              │  15 industries            │
                              │  8 infrastructure nodes   │
                              │                           │
                              │  BFS Supply Chain Trace   │
                              │  Event → Countries →      │
                              │  Routes → Products →      │
                              │  Industries → Ports →     │
                              │  Infrastructure →         │
                              │  Alternatives             │
                              └────────────┬──────────────┘
                                           │
                              ┌────────────▼──────────────┐
                              │   EVIDENCE FUSION ENGINE   │
                              │                           │
                              │  Cross-source signals     │
                              │  37 strategic keywords    │
                              │  Confidence: Strong /     │
                              │  Moderate / Weak          │
                              └────────────┬──────────────┘
                                           │
                    ┌──────────────────────▼───────────────────────┐
                    │         5 PARALLEL GROQ MODULES               │
                    │                                               │
                    │  ① Executive Summary    ② Supply Chain Map   │
                    │  ③ Recommendations      ④ Scenario Analysis  │
                    │                 ⑤ Evidence                   │
                    │                                               │
                    │  Each module receives:                        │
                    │  • Pre-computed supply chain exposure (KG)    │
                    │  • Corroborated evidence signals              │
                    │  • Strategic context summary                  │
                    └──────────────────────┬───────────────────────┘
                                           │
                              ┌────────────▼──────────────┐
                              │     REPORT ASSEMBLER       │
                              │   + GAP-FILL FROM KG       │
                              │                           │
                              │  Fills empty sections     │
                              │  from knowledge graph     │
                              │  when LLM misses them     │
                              └────────────┬──────────────┘
                                           │
                              ┌────────────▼──────────────┐
                              │   ZOD SCHEMA VALIDATION    │
                              │   Typed IntelligenceReport │
                              └───────────────────────────┘
```

### Supply Chain Reasoning Chain

Every intelligence observation follows this exact reasoning path:

```
① WHAT HAPPENED?
      │
      ▼
② WHICH COUNTRIES?  ──────────────────────────────────────────────────┐
      │                                                               │
      ▼                                                               ▼
③ WHICH TRADE CORRIDORS?            Alternative Suppliers Mapped For Each
   Hormuz · Malacca · Suez ·        Disrupted Product
   Bab-el-Mandeb · Black Sea
      │
      ▼
④ WHICH PRODUCTS / COMMODITIES?
   Crude Oil · LNG · APIs · Semiconductors ·
   Rare Earths · Fertilizers · Palm Oil...
      │
      ▼
⑤ WHICH IMPORT CATEGORIES?
   Energy · Minerals · Pharma · Electronics ·
   Agriculture · Defence · Industrial
      │
      ▼
⑥ WHICH INDIAN INDUSTRIES?
   Refining · Pharma · Electronics · Automotive ·
   Power · Agriculture · Defence · Chemicals...
      │
      ▼
⑦ WHICH INDIAN PORTS?
   JNPT · Mundra · Kandla · Chennai ·
   Vizag · Kochi · Kolkata · Mangalore...
      │
      ▼
⑧ WHAT CRITICAL INFRASTRUCTURE IS AT RISK?
   Refineries · Power Grid · Fertilizer Plants ·
   Pharma Clusters · Electronics Assembly Zones
      │
      ▼
⑨ OPERATIONAL RECOMMENDATION
      │
      ▼
⑩ INDIA IMPORT IMPACT STATEMENT
```

---

## Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND                                               │
│  ┌───────────┐  ┌───────────┐  ┌───────────────────┐   │
│  │  Next.js  │  │  React    │  │   Tailwind CSS 4  │   │
│  │   16.2    │  │   19      │  │   + Framer Motion │   │
│  └───────────┘  └───────────┘  └───────────────────┘   │
│  ┌───────────────────┐  ┌────────────────────────────┐  │
│  │  MapLibre GL 5    │  │  Lucide Icons + shadcn/ui  │  │
│  │  (Interactive Map)│  │                            │  │
│  └───────────────────┘  └────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  AI / LLM LAYER                                         │
│  ┌───────────────────┐  ┌────────────────────────────┐  │
│  │  Groq (Primary)   │  │  Google Gemini (Fallback)  │  │
│  │  LLaMA 3.1 70B    │  │  Automatic failover on     │  │
│  │  LLaMA 3.1 8B     │  │  rate limits / errors      │  │
│  └───────────────────┘  └────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  DATA SOURCES                                           │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ NewsAPI  │  │  AISStream   │  │  OpenSky Network  │  │
│  │ (news)   │  │ (maritime)   │  │  (mil. aviation)  │  │
│  └──────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  VALIDATION & SCHEMA                                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Zod — every LLM response validated before use   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
src/
├── app/                        # Next.js App Router pages & API routes
│   └── api/
│       ├── intelligence/       # Geopolitical intelligence endpoint
│       ├── ships/              # Live AIS vessel data endpoint
│       └── ...
│
├── components/                 # UI components
│   ├── dashboard-page/         # Main dashboard layout
│   ├── dashboard-kpi-row/      # Top KPI metric cards
│   ├── dashboard-alerts-table/ # Priority alerts panel
│   ├── dashboard-event-feed/   # Live event stream
│   ├── map/                    # MapLibre interactive map
│   │   └── ships/              # AIS vessel layer
│   ├── home-hero/              # Landing page hero
│   ├── home-module-grid/       # Module navigation grid
│   └── ui/                     # Shared UI primitives
│
├── features/                   # Domain feature modules
│   ├── geopolitical-intelligence/   # ★ Core intelligence engine
│   │   ├── knowledge-graph/         # 100+ node trade graph + BFS tracer
│   │   ├── modules/                 # 5 independent Groq AI modules
│   │   ├── prompts/                 # Supply-chain-first LLM prompts
│   │   ├── schemas/                 # Zod validation schemas
│   │   ├── services/                # Orchestration, preprocessing, assembly
│   │   └── types/                   # TypeScript types
│   ├── geopolitical-risk/           # Risk scoring & map overlay
│   ├── analytics/                   # Charts & historical analysis
│   ├── refinery/                    # Refinery capacity monitor
│   ├── procurement/                 # Supplier & contract intelligence
│   ├── strategic-reserve/           # Reserve level tracking
│   ├── scenario-simulator/          # What-if scenario modelling
│   └── historical-replay/           # Historical event playback
│
├── lib/
│   └── aisstream/              # WebSocket AIS vessel manager
│
└── services/
    ├── llm/                    # LLM router (Groq → Gemini fallback)
    └── shipService.ts          # Ship data service
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

| Tool | Version | Link |
|------|---------|------|
| Node.js | 18.x or higher | [nodejs.org](https://nodejs.org/) |
| npm | 9.x or higher | Included with Node.js |
| Git | Any | [git-scm.com](https://git-scm.com/) |

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/smart-supply-chain-analyst.git
cd smart-supply-chain-analyst
```

---

### Step 2 — Install Dependencies

```bash
npm install
```

---

### Step 3 — Configure Environment Variables

Copy the example env file and fill in your API keys:

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in the values:

```env
# ── REQUIRED ──────────────────────────────────────────────────
# Groq — Primary AI engine (free tier available)
# Get your key at: https://console.groq.com/
GROQ_API_KEY=gsk_...

# ── RECOMMENDED ───────────────────────────────────────────────
# Google Gemini — Fallback LLM when Groq hits rate limits
# Get your key at: https://aistudio.google.com/apikey
GEMINI_API_KEY=AI...

# AISStream — Live vessel tracking on the map
# Get your key at: https://aisstream.io/
AISSTREAM_API_KEY=...

# ── OPTIONAL ──────────────────────────────────────────────────
# NewsAPI — Live news for intelligence engine (uses curated mock data if missing)
# Get your key at: https://newsapi.org/
NEWS_API_KEY=...

# EIA — Crude oil spot prices (Brent/WTI) in the Procurement module
# Get your key at: https://www.eia.gov/opendata/register.php
EIA_API_KEY=...

# API Ninjas — Live energy commodity prices (LNG, coal, gas, etc.)
# Get your key at: https://api-ninjas.com/
API_NINJAS_KEY=...

# OpenSky Network — Military aviation intelligence (optional)
# Get credentials at: https://opensky-network.org/
OPENSKY_CLIENT_ID=
OPENSKY_CLIENT_SECRET=
```

> **Minimum to run:** Only `GROQ_API_KEY` is strictly required. Everything else gracefully falls back to curated mock data so the platform always has something to analyse.

---

### Step 4 — Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Step 5 — Generate Your First Intelligence Report

1. Navigate to the **Geopolitical Intelligence** module from the home screen
2. Click **"Generate Intelligence Report"**
3. Wait ~15–30 seconds for the AI to run all 5 analysis modules
4. The dashboard populates with full supply chain intelligence

---

## API Keys — Where to Get Them

```
┌──────────────────┬─────────────────────────────┬────────────┬───────────────┐
│  Key             │  What it powers              │  Free Tier │  Sign-up      │
├──────────────────┼─────────────────────────────┼────────────┼───────────────┤
│  GROQ_API_KEY    │  AI intelligence engine      │  ✅ Yes    │  console.groq │
│                  │  (primary LLM)               │            │  .com         │
├──────────────────┼─────────────────────────────┼────────────┼───────────────┤
│  GEMINI_API_KEY  │  AI fallback when Groq is    │  ✅ Yes    │  aistudio     │
│                  │  rate limited                │            │  .google.com  │
├──────────────────┼─────────────────────────────┼────────────┼───────────────┤
│  AISSTREAM_      │  Live ship tracking on       │  ✅ Yes    │  aisstream    │
│  API_KEY         │  the map                     │            │  .io          │
├──────────────────┼─────────────────────────────┼────────────┼───────────────┤
│  NEWS_API_KEY    │  Live geopolitical news      │  ✅ Yes    │  newsapi.org  │
│                  │  (mock data used if missing) │            │               │
├──────────────────┼─────────────────────────────┼────────────┼───────────────┤
│  OPENSKY_*       │  Military aviation signals   │  ✅ Yes    │  opensky-     │
│                  │  for intelligence engine     │            │  network.org  │
├──────────────────┼─────────────────────────────┼────────────┼───────────────┤
│  EIA_API_KEY     │  Brent/WTI crude oil spot    │  ✅ Yes    │  eia.gov/     │
│                  │  prices in Procurement       │            │  opendata     │
├──────────────────┼─────────────────────────────┼────────────┼───────────────┤
│  API_NINJAS_KEY  │  Live LNG, gas, coal prices  │  ✅ Yes    │  api-ninjas   │
│                  │  in Procurement module       │            │  .com         │
└──────────────────┴─────────────────────────────┴────────────┴───────────────┘
```

---

## How the AI Works

### LLM Router — Automatic Failover

```
Request comes in
      │
      ▼
  Groq API ──── success ──► Return response
      │
    fails / rate limited
      │
      ▼
  Gemini API ── success ──► Return response
      │
    fails
      │
      ▼
   Error thrown (both LLMs unavailable)
```

### Module Caching Strategy

```
                    ┌─────────────────────────────────────────┐
                    │         Cache TTL per Module             │
                    │                                         │
                    │  Executive Summary   ──  30 min         │
                    │  Supply Chain Impact ──  30 min         │
                    │  Recommendations     ──  30 min         │
                    │  Scenario Analysis   ──  Context hash*  │
                    │  Evidence            ──  30 min         │
                    │                                         │
                    │  * Scenario module invalidates when     │
                    │    the intelligence context changes,    │
                    │    not on a fixed timer                 │
                    └─────────────────────────────────────────┘
```

Each of the 5 modules caches independently. If news is stale but a new maritime alert arrives, only the modules whose context hash changed are re-run.

---

## Knowledge Graph

The intelligence engine is backed by a static strategic knowledge graph of India's import ecosystem — 100+ nodes representing real trade relationships, not invented by the AI.

```
                    KNOWLEDGE GRAPH NODE TYPES
                    ──────────────────────────

  🌍 Countries          🚢 Corridors         🏭 Products
  ─────────────         ────────────         ──────────
  Iraq (23% crude)      Hormuz               Crude Oil
  Saudi Arabia          Malacca              LNG / LPG
  China                 Suez                 Semiconductors
  Russia                Bab-el-Mandeb        Rare Earths
  Indonesia             South China Sea      Pharma APIs
  Qatar                 Black Sea            Fertilizers
  Australia             Panama               Solar Panels
  Taiwan                Cape of Good Hope    Palm Oil
  + 22 more...                               + 12 more...

  🚢 Indian Ports       🏗️ Industries        🏭 Infrastructure
  ───────────────       ─────────────        ─────────────────
  JNPT                  Petroleum Refining   West Coast Refineries
  Mundra                Pharmaceuticals      East Coast Refineries
  Kandla                Electronics Mfg      National Power Grid
  Chennai               Automotive           Pharma Clusters
  Vizag                 Power Generation     Fertilizer Plants
  Kochi                 Agriculture          Electronics Zones
  Kolkata               Steel Production     (TN, Noida)
  + 5 more...           + 7 more...
```

When an event is detected (e.g., "Houthi attack in Red Sea"), the graph engine:
1. Matches all entity aliases in the intelligence text
2. Runs BFS traversal (3 hops) from matched nodes
3. Traces: Corridor → Products → Categories → Industries → Ports → Infrastructure
4. Resolves alternative suppliers for disrupted products
5. Delivers deterministic context to the AI — so it reasons with facts, not guesses

---

## Development

### Available Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build production bundle
npm run start    # Start production server
npm run lint     # Run ESLint
npx tsc --noEmit # Type-check without building
```

### Environment Modes

| Mode | Command | Behaviour |
|------|---------|-----------|
| Development | `npm run dev` | Hot reload, verbose console logs |
| Production | `npm run build && npm run start` | Optimised bundle, minimal logs |

### Adding a New Intelligence Data Source

The intelligence pipeline uses a plugin system. To add a new data source:

```typescript
// src/features/geopolitical-intelligence/services/mySource.ts

import type { DataSourcePlugin, DataSourceOutput } from "../types";

class MyDataSourcePlugin implements DataSourcePlugin {
  readonly name = "My Data Source";

  async fetch(): Promise<DataSourceOutput[]> {
    // Fetch and return structured data
    return [{ source: this.name, data: { ... } }];
  }
}

export const myDataSource = new MyDataSourcePlugin();
```

Then register it in `intelligenceService.ts`:

```typescript
const DATA_SOURCES: DataSourcePlugin[] = [
  newsDataSource,
  openSkyDataSource,
  aisIntelligenceDataSource,
  myDataSource,  // ← add here
];
```

---

## Dashboard Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER  ─  Navigation · Module switcher · Status indicators    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  KPI ROW  ──  Threat Level · Active Alerts · Corridors          │
│               At Risk · Supply Chain Health Score               │
│                                                                 │
├────────────────────────────┬────────────────────────────────────┤
│                            │                                    │
│  INTERACTIVE MAP           │  GEOPOLITICAL INTELLIGENCE         │
│                            │                                    │
│  • Live AIS vessel tracks  │  • Executive Summary               │
│  • Trade corridor overlays │  • Key Developments                │
│  • Risk zone heatmaps      │  • Affected Products               │
│  • Port indicators         │  • Affected Trade Corridors        │
│                            │  • Affected Ports & Industries     │
│                            │  • Supply Chain Impacts            │
│                            │  • Alternative Suppliers           │
│                            │  • Recommendations                 │
│                            │  • Scenario Analysis               │
│                            │  • Evidence & Intelligence         │
│                            │                                    │
├────────────────────────────┼────────────────────────────────────┤
│                            │                                    │
│  ALERTS TABLE              │  LIVE EVENT FEED                   │
│  Priority-sorted supply    │  Real-time stream of intelligence  │
│  chain disruption alerts   │  observations as they come in      │
│                            │                                    │
└────────────────────────────┴────────────────────────────────────┘
```

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Intelligence report is empty | `GROQ_API_KEY` missing or invalid | Check `.env.local` and verify key at console.groq.com |
| Map shows no vessels | `AISSTREAM_API_KEY` missing | Add key or accept that map runs without live vessels |
| Report not refreshing | Old report cached (30-min TTL) | Restart the dev server to clear in-memory cache |
| AI falls back to Gemini | Groq rate limit hit | Normal behaviour — add `GEMINI_API_KEY` as fallback |
| Build errors | TypeScript issues | Run `npx tsc --noEmit` to see detailed errors |
| `NEWS_API_KEY` missing | Not set | Platform uses curated mock articles — still fully functional |

---

## License

MIT — do whatever you want with it.

---

<div align="center">

Built for anyone who wants to understand what's happening to India's supply chains  
before it shows up in the price of their goods.

</div>