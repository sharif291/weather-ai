# Implementation Plan: TerraClimate Full-Stack Dashboard

This plan outlines the architecture for **TerraClimate** using a modular serverless setup: **React (Frontend)**, **Node.js/Express inside AWS Lambda (Backend API)**, **Redis (Caching)**, **AWS SQS (Queueing)**, **PostgreSQL (Relational Database)**, **AWS S3 (User File Uploads)**, **Firebase Auth & Realtime Firestore (Broadcasting)**, and **AWS CDK (Infrastructure as Code)**.

---

## 🛠️ The Tech Stack

*   **Frontend**: React (Vite) + **Tailwind CSS v4** + **Recharts** + **React Icons** + **Firebase Client SDK** (for auth and real-time alerts).
*   **Backend**: **Node.js + Express** running serverlessly inside **AWS Lambda** (wrapped via `@vendia/serverless-express`) and exposed via **AWS API Gateway**.
*   **Database**: **PostgreSQL** (mapped via **Prisma ORM** for schema and migrations). Hosted on Neon.tech/Supabase (free tier) or AWS RDS.
*   **Auth & Realtime Broadcasts (Firebase Spark Plan - Free)**: 
    *   **Firebase Authentication**: Managing user accounts.
    *   **Cloud Firestore**: Real-time message storage for user alerts and global banners, synced to the client via `onSnapshot`.
*   **File Storage**: **AWS S3** (User uploads bucket storing farm photos via S3 Presigned URLs).
*   **Caching**: **Redis** (production mode via Upstash Free tier) with an automatic fallback to **in-memory `node-cache`** (for zero-config local testing).
*   **Message Queue (Notifications)**: **AWS SQS** (production mode) with an automatic fallback to an **in-memory Node.js array queue** (for zero-config local runs).
*   **Infrastructure (AWS CDK)**: **TypeScript AWS CDK** stack provisioning S3 (hosting + uploads), CloudFront, SQS, Lambda, and API Gateway.

---

## 📁 Project Structure (Aligned with `soruyor`)

To match the modular monolithic layout of the reference project, we split the codebase into frontend, backend, and infrastructure folders:

```
weather-ai/
├── backend/                  # Node.js + Express Serverless API
│   ├── prisma/
│   │   ├── schema.prisma     # Prisma database schema definition
│   │   └── migrations/       # SQL migrations files
│   ├── src/
│   │   ├── core/             # Configuration, Redis, AWS SQS wrapper, database client, AWS S3 Client, Firebase Admin
│   │   │   ├── config.js     # Env configuration
│   │   │   ├── db.js         # Prisma client initializer
│   │   │   ├── firebase.js   # Firebase Admin SDK (used by worker to write alerts)
│   │   │   ├── redis.js      # Redis service with local cache fallback
│   │   │   ├── queue.js      # AWS SQS / Memory queue service
│   │   │   ├── s3.js         # AWS S3 Client for presigned URLs
│   │   │   └── auth.js       # Firebase Admin verification middleware
│   │   ├── modules/          # Feature Modules
│   │   │   ├── weather/      # Weather endpoints (routes, controller, service)
│   │   │   ├── farms/        # Farms manager (CRUD coordinates + S3 url links)
│   │   │   └── notifications/# Alerts manager (sends alert details to SQS)
│   │   ├── workers/          # Asynchronous workers
│   │   │   └── notification.worker.js # background SQS consumer (writes to Firestore)
│   │   ├── lambda.js         # Vendia serverless-express wrapper entry point
│   │   └── server.js         # Entry point for local express server
│   ├── package.json
│   └── template.yaml
│
├── frontend/                 # React + Tailwind v4 Client
    ├── src/
    │   ├── components/       # Reusable UI widgets (cards, file uploader, Toast notification)
    │   ├── views/            # Main tabs (FarmPlanner, AgriTimeline)
    │   ├── services/         # API HTTP Client, Firebase SDK initializers
    │   ├── hooks/            # Custom hooks (useWeather, useFarms, useRealtimeAlerts)
    │   ├── App.jsx           # Coordinate router, layouts, and global state
    │   └── index.css         # Tailwind v4 directives and animations
    ├── package.json
    └── vite.config.js
│
└── infra/                    # Infrastructure as Code (AWS CDK)
    ├── bin/
    │   └── cdk.ts            # Entry point for CDK deployments
    ├── lib/
    │   └── terraclimate-stack.ts # Provisions S3, CloudFront, SQS, Lambda, and API Gateway
    └── package.json
```

---

## ⚡ Real-Time Broadcasting Strategy (Firebase Firestore)

1.  **Worker-to-Firestore Push**: When the `notification.worker.js` background worker consumes a weather warning from AWS SQS, it writes a real-time event log to:
    *   `/users/{userId}/notifications/{notificationId}` (individual alert).
    *   `/global_broadcasts/{broadcastId}` (global emergency notification).
2.  **Frontend Realtime Listener**: The React app initializes a Firestore `onSnapshot()` listener in `src/hooks/useRealtimeAlerts.js` on mount.
3.  **Dynamic Toasts**: When a new notification arrives in Firestore, the state updates instantly, popping up an animated banner alert in the user interface.

---

## Proposed Changes

### [NEW] Backend Workers & Firebase Admin integration

#### [NEW] [backend/src/core/firebase.js](file:///Users/sharifhossain/Documents/Personal/assesment/weather-ai/backend/src/core/firebase.js)
Initializes Firebase Admin SDK to allow backend services and background workers to authenticate users and write real-time alerts to Firestore.

#### [NEW] [backend/src/workers/notification.worker.js](file:///Users/sharifhossain/Documents/Personal/assesment/weather-ai/backend/src/workers/notification.worker.js)
Processes SQS messages. In addition to email logging, it uses Firebase Admin to write real-time notifications to Firestore.

### [NEW] Frontend Realtime Hook & Components

#### [NEW] [frontend/src/hooks/useRealtimeAlerts.js](file:///Users/sharifhossain/Documents/Personal/assesment/weather-ai/frontend/src/hooks/useRealtimeAlerts.js)
React hook opening Firestore realtime queries (`onSnapshot`) listening for warnings and triggering UI toasts.

#### [NEW] [frontend/src/components/NotificationToast.jsx](file:///Users/sharifhossain/Documents/Personal/assesment/weather-ai/frontend/src/components/NotificationToast.jsx)
A floating banner that slides onto the screen in real-time when a warning is broadcast.

---

## Verification Plan

### Manual Verification
1.  **SQS-to-Toast pipeline**: Push a test warning to SQS, verify that the worker picks it up, writes to Firestore, and a slide-in alert appears on the React dashboard in real-time.
2.  **Global Broadcast**: Create a broadcast in Firestore manually, verify all active browsers receive the alert banner simultaneously.
