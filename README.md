# 🌐 Smart Supply Chain Analyst

> **AI-Powered Geopolitical & Supply Chain Intelligence Platform for India's Import Ecosystem**

An enterprise-grade platform that continuously monitors global geopolitical developments, maritime activity, logistics disruptions, and procurement workflows to generate AI-powered operational intelligence for India's import ecosystem.

**This is NOT a news dashboard.** News is only an input. The platform transforms real-time data into structured, actionable business intelligence for supply chain professionals.

---

# ✨ Features

| Feature | Status | Description |
| :--- | :---: | :--- |
| 🗺️ Live World Map | ✅ Live | Fixed MapLibre world map centred on India with maritime trade corridors. |
| 🧠 AI Geopolitical Intelligence | ✅ Live | AI-generated supply chain intelligence powered by Groq LLM. |
| 📦 Procurement Dashboard | ✅ Live | Procurement management dashboard with suppliers, spending analytics and procurement insights. |
| 📊 Analytics Module | 🚧 Planned | Supply chain KPIs and business analytics. |
| 📈 Historical Replay | 🚧 Planned | Replay historical geopolitical and logistics events. |
| 🏭 Refinery Module | 🚧 Planned | Refinery monitoring and operational insights. |
| 🎯 Scenario Simulator | 🚧 Planned | AI-driven supply chain scenario planning. |
| 🛢 Strategic Reserve | 🚧 Planned | Strategic reserve monitoring and forecasting. |

---

# 🚀 Quick Start

## Prerequisites

- Node.js 18+
- npm 9+
- Git

---

## Clone Repository

```bash
git clone https://github.com/Abbas-sp3/Smart-Supply-Chain-Analyst.git

cd Smart-Supply-Chain-Analyst
```

---

## Install Dependencies

```bash
npm install
```

---

## Environment Variables

Create a file named

```
.env.local
```

Add the following variables:

```env
# AIS Vessel Tracking
AISSTREAM_API_KEY=your_api_key

# Groq AI
GROQ_API_KEY=your_api_key

# News API
NEWS_API_KEY=your_api_key
```

The application works even without API keys by using built-in mock data.

---

## Run Development Server

```bash
npm run dev
```

Visit

```
http://localhost:3000
```

---

# 📂 Project Structure

```
src
│
├── app
│   ├── api
│   │   ├── intelligence
│   │   └── ships
│   │
│   ├── geopolitical-risk
│   ├── procurement
│   ├── layout.tsx
│   └── globals.css
│
├── assets
│
├── components
│   ├── app-shell
│   ├── map
│   ├── ui
│   └── shared
│
├── features
│   ├── geopolitical-intelligence
│   ├── procurement
│   ├── analytics
│   ├── refinery
│   ├── scenario-simulator
│   ├── historical-replay
│   └── strategic-reserve
│
├── hooks
│
├── lib
│   ├── aisstream
│   ├── constants
│   ├── map-engine
│   └── maplibre
│
├── services
│
├── types
│
└── utils
```

---

# 🧠 AI Intelligence Engine

The platform generates intelligence through a modular pipeline that separates **AI reasoning** from **React presentation**:

```
Collectors (NewsAPI, OpenSky, AISStream)
      │
      ▼
Normalizers & Fact Extraction
      │
      ▼
Knowledge Graph Augmentation
      │
      ▼
Priority Engine (CRITICAL → BACKGROUND)
      │
      ▼
Compact Intelligence Context
      │
      ▼
┌─────────────────────────────────────────────┐
│  5 Independent Groq Modules (parallel)      │
│  • Executive Summary      (15 min cache)    │
│  • Supply Chain Impact    (30 min cache)    │
│  • Recommendations        (30 min cache)    │
│  • Scenario Analysis      (on context change)│
│  • Evidence               (30 min cache)      │
└─────────────────────────────────────────────┘
      │
      ▼
Report Assembler (one fact → many UI sections)
      │
      ▼
Zod Validation → IntelligenceReport JSON
      │
      ▼
Dashboard Components (React renders structured data)
```

**Key design principles:**
- Groq generates **structured data**, not dashboard prose
- Each module has a concise prompt (≤500 words) and independent cache TTL
- Supply chain facts are emitted once and projected to Countries, Products, Ports, etc.
- Raw API payloads never reach Groq — only compact intelligence context

The dashboard provides:

- Executive Summary
- Key Developments
- Why India Should Care
- Affected Products
- Trade Corridors
- Countries
- Ports
- Industries
- Supply Chain Impacts
- Alternative Sourcing
- Recommendations
- Evidence References

Users never interact with raw news articles.

---

# 📦 Procurement Module

The Procurement Dashboard provides:

- Procurement Overview
- Supplier Management
- Category Management
- Procurement Analytics
- Spend Monitoring
- Procurement Insights
- Purchase Activity Tracking
- Dashboard Cards
- Interactive Tables
- Clean Enterprise UI

Designed for procurement professionals to monitor sourcing activities from one centralized dashboard.

---

# 🚢 Maritime Intelligence

Live vessel tracking is powered by AISStream.

Features include:

- Real-time Cargo Ship Tracking
- India Focused Maritime Region
- Arabian Sea Monitoring
- Bay of Bengal Monitoring
- Trade Corridor Visualization
- Vessel Filtering

---

# 🗺 Map System

The map is intentionally non-interactive.

It provides:

- India-focused viewport
- Fixed zoom
- Maritime trade routes
- Live vessel markers
- Animated background layers

Scroll, zoom and drag are disabled to improve dashboard usability.

---

# 🚀 Technology Stack

## Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- Shadcn UI

## Mapping

- MapLibre GL JS
- AISStream API

## Backend

- Next.js API Routes

## AI

- Groq LLM

## Validation

- Zod

## APIs

- News API
- AISStream

---

# 📜 Available Scripts

| Command | Description |
|----------|-------------|
| npm run dev | Start development server |
| npm run build | Production build |
| npm run start | Start production server |
| npm run lint | Run ESLint |

---

# 🏗 Architecture Principles

- Feature Driven Architecture
- Modular Components
- API-first Communication
- AI-powered Intelligence
- Strong Type Safety
- Zod Validation
- Reusable Components
- Separation of Business Logic

---

# 📈 Roadmap

## Completed

- ✅ AI Intelligence Engine
- ✅ Live Vessel Tracking
- ✅ Procurement Dashboard
- ✅ India-focused Map

## In Progress

- 🚧 Analytics
- 🚧 Historical Replay
- 🚧 Refinery Dashboard
- 🚧 Strategic Reserve
- 🚧 Scenario Simulator

---

# 🤝 Contribution Guidelines

Before contributing:

- Pull latest changes
- Create meaningful commits
- Ensure `npm run build` passes
- Ensure `npm run lint` passes
- Follow Feature Driven Architecture
- Keep components modular
- Route all external API calls through API routes

---

# 📸 Screenshots

## Dashboard

_Add dashboard screenshot here_

---

## Procurement Module

_Add procurement dashboard screenshot here_

---

## AI Intelligence Dashboard

_Add intelligence dashboard screenshot here_

---

# 👨‍💻 Contributors

- **Abbas** — Project Lead
- **Sanskar Soni** — Procurement Module Development
- Other Contributors

---

# 📄 License

This project is developed for research, innovation and educational purposes.

---

# ⭐ Future Vision

Smart Supply Chain Analyst aims to become a complete AI-powered decision support platform for India's import ecosystem by integrating:

- AI Intelligence
- Procurement
- Logistics
- Maritime Tracking
- Commodity Prices
- Weather Intelligence
- Port Congestion
- Sanctions Monitoring
- Demand Forecasting
- Risk Prediction
- Scenario Simulation

bringing all critical supply chain intelligence into a single enterprise platform.