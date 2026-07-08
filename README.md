# 🌐 Smart Supply Chain Analyst
> **Enterprise Geopolitical Energy Supply Chain Intelligence Platform**

An advanced, real-time interactive geopolitical and energy supply chain simulation, intelligence, and analysis platform designed for logistics analysts, operations directors, and risk managers.

---

## 🚀 Quick Start Guide

Follow these steps to clone, set up, and run the platform locally on your machine.

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js** (v18.x or higher recommended)
- **npm** (v9.x or higher) or **Yarn** / **pnpm**
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/Abbas-sp3/Smart-Supply-Chain-Analyst.git
cd Smart-Supply-Chain-Analyst
```

### 3. Environment Configuration (Optional)
The platform is designed to run out of the box with the default CARTO Dark Matter basemap (which doesn't require API keys). If you have environment-specific variables, you can copy the template:
```bash
cp .env.example .env.local
```

### 4. Install Dependencies
Install all required package dependencies:
```bash
npm install
```

### 5. Launch the Development Server
Run the local Next.js development server:
```bash
npm run dev
```

The application will be hosted at [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Project Scripts

You can run the following npm scripts in the project directory:

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server on [http://localhost:3000](http://localhost:3000) with hot-reloading. |
| `npm run build` | Builds the application for production deployment. Optimizes assets, styles, and code. |
| `npm run start` | Runs the built Next.js application in production mode. |
| `npm run lint` | Runs ESLint to check for code quality and syntax standards. |

---

## 🏗️ Architecture & Project Structure

The project follows a **Feature-Driven Architecture**, segregating domains into modular folders to guarantee high scalability and clean isolation of concerns.

```
src/
├── app/                    # Next.js App Router (pages and layouts)
├── assets/                 # Global static files (images, icons, vectors)
├── components/             # Reusable design system & UI components
│   └── ui/                 # Shadcn UI primitives (buttons, dialogs, cards)
├── features/               # High-cohesion domain modules
│   ├── analytics/          # Data visualization & reporting pipelines
│   ├── geopolitical-risk/  # Geopolitical risk monitoring & alerts
│   ├── historical-replay/  # Time-travel cargo/incident analysis
│   ├── procurement/        # Supplier and route contract management
│   ├── refinery/           # Refinery capacity and flow monitors
│   ├── scenario-simulator/ # What-if routing & outage simulators
│   └── strategic-reserve/  # Crude oil/LNG reserves tracking
├── hooks/                  # Global custom React hooks
├── lib/                    # Shared utility configs and client instances
├── services/               # Core backend service clients
├── types/                  # Global shared TypeScript models
└── utils/                  # Pure utility and formatting functions
```

### Feature Module Layout
Each sub-folder under `src/features/` is structured as a self-contained unit:
```
features/<feature-name>/
├── components/   # Feature-specific React views
├── hooks/        # Feature-specific state/data hooks
├── services/     # Feature-specific APIs or simulations
├── types/        # Feature-specific types
├── constants/    # Feature-specific configuration/static data
└── index.ts      # Barrel file exporting public API only
```

---

## 🗺️ Live Wallpaper World Map System
The world map is rendered using **MapLibre GL JS** and styled using a custom CARTO Dark Matter theme.
- **Design Philosophy**: The world map is designed as a rich, slow-moving, subtle background visual ("live wallpaper") representing global trade flows, vessel courses, and active ports without distracting analysts from panel interfaces.
- **Data Integrity**: All simulation layers, mock coordinates, and trade paths are controlled purely within client-side features and backend mock endpoints.

---

## 🤝 Contribution Guidelines
1. **Preserve Architecture**: All new capabilities must be placed under their respective feature directories in `src/features/` rather than adding logic directly to the routing/view layers under `src/app`.
2. **Modularity**: Never cross-import non-exported files from other features directly; interact only via the feature's public API in its `index.ts`.
3. **No Direct Third-Party APIs**: Any third-party APIs (e.g., vessel trackers, weather feeds) must be routed through API handlers in `src/app/api/` rather than calling endpoints directly from React components.

