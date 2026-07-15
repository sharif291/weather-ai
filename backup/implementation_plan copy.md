# Implementation Plan: TerraClimate (Resilient Farm Dashboard)

This plan details the architecture and roadmap for building **TerraClimate**, a unified precision agricultural planning tool. It integrates our agricultural planner and hourly operations timeline, with developer caching telemetry integrated secondary inside the API Settings drawer.

---

## Proposed Changes

We will build the frontend using **Vite + React** and style it with premium **Vanilla CSS** (featuring dark-mode glassmorphic layouts, interactive SVG components, and custom grid systems).

### 1. Data Layer & Caching Proxy (`src/services/api.js`)
*   **Endpoints Integrated**:
    *   `GET /v1/current?q={query}` (Current conditions, wind, UV, humidity).
    *   `GET /v1/forecast?q={query}` (3-day forecasts).
    *   `GET /v1/hourly?q={query}` (24-hour granular parameters).
    *   `GET /v1/weather-geo?lat={lat}&lon={lon}` (Coordinates-based lookup).
    *   `GET /v1/daily?q={query}&date={date}` (Historical weather).
    *   `GET /v1/usage` (API key metrics).
*   **Key Engineering Features**:
    *   **Scale-Shield Caching**: Checks `sessionStorage` for coordinate/query hashes before making network requests. Caches responses for 15 minutes.
    *   **Queue-Based Throttler**: Intercepts outgoing requests. If requests are triggered within 200ms of each other, it staggers them sequentially to guarantee they never exceed the 5 req/sec rate limit.
    *   **System Diagnostics Logger**: Exposes cache states and API latency details to a global listener for the developer dashboard.

### 2. UI Components & Layouts

#### [NEW] [src/index.css](file:///Users/sharifhossain/Documents/Personal/assesment/weather-ai/src/index.css)
*   **Design Tokens**: Elegantly curated dark space theme (`#080e1a` background, HSL teal/emerald `#10b981`, soft cyan accents, warnings gold, and diagnostic neon purple).
*   **Aesthetics**: Glassmorphism cards, micro-interactions, responsive grid alignments, and custom animations.

#### [NEW] [src/App.jsx](file:///Users/sharifhossain/Documents/Personal/assesment/weather-ai/src/App.jsx)
*   State manager and layout container. Provides tab routing between **Farm Planner** and **AgriTimeline**, coordinate selectors, and holds global API state.

#### [NEW] [src/components/Sidebar.jsx](file:///Users/sharifhossain/Documents/Personal/assesment/weather-ai/src/components/Sidebar.jsx)
*   Elegant left-side navigation for search query inputs, coordinate forms, preset location buttons, and the Settings gear trigger.

#### [NEW] [src/components/FarmPlanner.jsx](file:///Users/sharifhossain/Documents/Personal/assesment/weather-ai/src/components/FarmPlanner.jsx)
*   Combines current conditions, wind/humidity vector visualizers, and the **Rule-Based Agro-Adviser** (generating crop warnings like wind pesticide warnings, heavy rain planting warnings, or UV irrigation holds).

#### [NEW] [src/components/AgriTimeline.jsx](file:///Users/sharifhossain/Documents/Personal/assesment/weather-ai/src/components/AgriTimeline.jsx)
*   **Operations Timeline**: Interactive slider to inspect weather indexes hour-by-hour for planning windows.
*   **Historical Day-Compare**: A panel to select a past calendar date and fetch `/v1/daily` data to compare with current conditions.

#### [NEW] [src/components/SettingsDrawer.jsx](file:///Users/sharifhossain/Documents/Personal/assesment/weather-ai/src/components/SettingsDrawer.jsx)
*   **API Key Management**: Form input to enter and clear API keys.
*   **Developer Telemetry Section**: 
    *   Radial usage dial showing requests consumed vs remaining limit (`/v1/usage`).
    *   Console feed showing live caching logs (e.g., `[Cache Hit] Nairobi weather fetched in 0ms`).
    *   Throttler test button to fire multiple requests and watch the staggering queue in action.

---

## Scaling & Technical Challenges Addressed
1.  **Rate-Limit Shielding**: Prevent HTTP 429 errors on the Free Tier via local memory/session caching.
2.  **Concurrency Throttling**: A front-end queueing system ensuring high stability.
3.  **API Resilience**: Seamless fallback to mock data when network requests fail or when key limits are exceeded.

---

## Verification Plan

### Manual Verification
1.  **Vite Local Run**: Verify code builds and runs locally at `http://localhost:5173`.
2.  **Telemetry Tests**: Open the Settings drawer and verify cache hit/miss statuses and throttle logs.
3.  **Cross-Tier Checks**: Input active and mock keys to verify response switching.
4.  **Layout Resiliency**: Verify responsive behavior on sizes from 320px to 2560px.
