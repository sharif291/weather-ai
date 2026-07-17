# 🌱 TerraClimate - Full-Stack Precision Agriculture Dashboard

TerraClimate is a serverless, decoupled full-stack precision agricultural planning tool and tenant settings console built using **React, Tailwind CSS v4, Node.js/Express, PostgreSQL, and AWS (CDK, SQS, Lambda, CloudFront, S3)**. 

It translates raw micro-climate weather feeds from the WeatherAI API into localized, crop-specific advisory actions (e.g. pesticide spray warnings, heavy rain holds, storm alerts) for smallholder farmers, while demonstrating resilient systems engineering and multi-tenant SaaS API isolation.

---

## 🛠️ The Tech Stack

*   **Frontend**: React (Vite), Tailwind CSS v4, Recharts (weather trend curves), React Icons.
*   **Backend**: Node.js + Express wrapped via `@vendia/serverless-express` running serverlessly in **AWS Lambda** via **AWS API Gateway**.
*   **Database**: **PostgreSQL** managed via **Prisma ORM** (handling relational schema migrations).
*   **Auth & Real-Time Sync**: **Firebase Auth** (user sessions) + **Cloud Firestore** (pushing realtime notifications using `onSnapshot` listeners).
*   **Caching**: **Redis** (via Upstash in production or local Docker Redis service).
*   **Message Broker**: **AWS SQS** (via AWS SQS or local Docker ElasticMQ service).
*   **Asset Storage**: **AWS S3** (storing farm blueprints/maps via secure S3 Presigned PUT URLs).
*   **IaC**: **AWS CDK** in TypeScript (defining all cloud resources).

---

## 📁 Project Folder Layout

```
weather-ai/
├── backend/                  # Express serverless API & SQS Worker
│   ├── prisma/               # Schema definitions and database migrations
│   └── src/
│       ├── core/             # Redis cache, SQS queue, S3 upload config wrappers
│       ├── modules/          # Feature endpoints (weather, farms, notifications)
│       ├── workers/          # background SQS consumer worker
│       └── server.js         # Local HTTP Server entry point
│
├── frontend/                 # Vite React SPA
│   └── src/
│       ├── components/       # ImageUpload node and Realtime Toast selectors
│       ├── views/            # FarmPlanner, AgriTimeline, and Diagnostics console
│       └── services/         # Firebase Client SDK & API proxy configurations
│
└── infra/                    # Infrastructure as Code (AWS CDK TypeScript)
    ├── bin/cdk.ts            # App synth entry point
    └── lib/terraclimate-stack.ts  # provisions CloudFront, S3, SQS, Lambda, and API Gateway
```

---

## 📖 How to Use (Features & Alert Guidelines)

TerraClimate is designed as an interactive portal to orchestrate crop-specific weather parameters and manage farm health settings.

### 1. Registering and Managing Farms
*   **Create a Farm**: Log in, click the `+` button in the sidebar under "My Registered Farms", and fill out the coordinates, crop type, and weather thresholds.
*   **Coordinate Picker**: Use the Leaflet Map Modal to click on any point on the map to automatically populate latitude and longitude coordinates. Alternatively, type coordinates manually or type a city name to use geocoding search.
*   **Blueprint Uploads**: Drag and drop or upload a farm layout image (PNG/JPEG). The browser requests a secure presigned PUT URL and uploads it directly to the AWS S3 storage bucket.
*   **Editing & Decommissioning**: Click the edit gear icon next to any farm to adjust thresholds or decommission (delete) the farm profile.

### 2. Micro-Climate Charts and Hourly Trends
*   **Hourly & Trends View**: Select a farm from the sidebar to load its weather dashboard.
*   **24-Hour Micro-Analytics Chart**: Visualize temperature and rain probability curves. Hover over the chart to see local dates and hours dynamically formatted in the tooltip.
*   **Operational Slider**: Drag the fieldwork hourly planner slider (00:00 to 23:00) to check temperature, condition summaries, and rain probabilities for specific hours.
*   **Historical Climate Trend Lookup**: Select a past calendar date and hit "Compare Trends" to run comparative data indexes comparing historical precipitation and average temperatures side-by-side with today's readings.

### 3. Automated Advisory Scans & Real-Time Alerts
The background advisory engine scans all active farms hourly, comparing actual weather data against user-defined alert thresholds:

| Alert Type | Threshold Field | Default Trigger Condition | Default Advisory Action & Message |
| :--- | :--- | :--- | :--- |
| **WIND_ALERT** | Wind Speed (`windThreshold`) | Actual wind speed > threshold | Enqueues warning task: *"High wind warnings detected. Please cancel pesticide spraying."* |
| **STORM_ALERT** | Rain (`rainThreshold`) | Actual precipitation > threshold | Enqueues warning task: *"Severe storm/precipitation forecast. Hold fertilizer applications."* |

*   **Custom Notifications**: Configure the farm settings to select dispatch channels:
    *   **In-App Alerts**: Pushes a real-time notification toast on the UI using Firestore listeners.
    *   **Email Logs**: Sends an email advisory summary to the user's registered address.
    *   **Discord Webhooks**: Broadcasts alerts instantly to configured Discord channels.
*   **Advisory Simulator**: You can manually trigger simulations for testing by clicking **Trigger Alert Simulation** inside the settings drawer to test pipeline health instantly.

---

## ⚡ Caching, SaaS Isolation & Queue Resiliency (Scaling Shields)

To safeguard the application from scale limits and ensure high availability:
1.  **Multi-Tenant SaaS Key Model**: Outgoing API credentials are isolated per user account. Rather than relying on a shared backend env token, users configure their personal keys in settings. Telemetry, background scanner runs, and query widgets are strictly scoped to the tenant's key.
2.  **On-the-Fly DB Sync**: When users authenticate via standard sign-in or Google SSO, the Express middleware automatically creates/updates their record in PostgreSQL if they are a first-time visitor.
3.  **Rate-Limit Sliding Window**: Outgoing API queries are queued and staggered via an async throttler window to respect WeatherAI's 5 req/sec rate limits.
4.  **Cache-Aside (Redis)**: Outbound endpoints are cached for **15 minutes** (Redis/Upstash) to speed up load times and prevent excessive API credit billing.
5.  **EventBridge Cron & SQS Workers**: Advisory scanners execute as an EventBridge schedule Lambda every 15 minutes. Warning triggers are enqueued to AWS SQS and processed serverlessly by SQS Lambda consumers, dispatching notifications across Firestore, Email, SMS (Twilio), and Discord.
6.  **Direct S3 Browser Uploads**: Satellite maps are uploaded securely from the client directly to S3 using short-lived S3 Presigned PUT URLs, preventing server bandwidth congestion.

---

## ⚙️ Environmental Setup

To run the application locally or in production, configure environment files in both the `/backend` and `/frontend` directories.

### 1. Backend Setup (`backend/.env`)

Create a `.env` file in the `backend/` directory:

```env
# Server Port Configuration
PORT=3000

# PostgreSQL Database Connection (Prisma)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/terraclimate"

# WeatherAI API Configuration
WEATHER_AI_API_KEY="wai_live_xxxxxx"

# Caching Configuration (Requires Redis)
REDIS_URL="redis://localhost:6379"

# AWS Configuration (SQS notifications & S3 uploads)
AWS_REGION="us-east-2"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_UPLOAD_BUCKET="terraclimate-uploads-bucket"

# AWS SQS Queue URLs (Use local ElasticMQ endpoints for local development)
AWS_SQS_QUEUE_URL="http://localhost:9324/queue/terraclimate-notification-queue"
AWS_ENDPOINT_URL_SQS="http://localhost:9324"

# Firebase Admin Configuration (Required for Auth token validation & Realtime alerts)
FIREBASE_PROJECT_ID="terraclimate-xxxxx"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@terraclimate-xxxxx.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="<PRIVATE_KEY>"
```

#### How to obtain Backend parameters:
*   **DATABASE_URL**: Connects Prisma to PostgreSQL. For local sandbox development, use the preconfigured docker link above. For production setups, create a database on **Neon** (`neon.tech`) or AWS RDS and copy the connection string.
*   **WEATHER_AI_API_KEY**: Sign up at the **WeatherAI Developer Portal** and generate an API key (begins with `wai_live_`).
*   **FIREBASE Admin Credentials**: 
    1. Open the [Firebase Console](https://console.firebase.google.com/).
    2. Go to **Project Settings** ➔ **Service Accounts**.
    3. Click **Generate New Private Key** to download a JSON credentials file.
    4. Extract `project_id`, `client_email`, and format the multi-line `private_key` (ensuring `\n` linebreaks are preserved).
*   **AWS Credentials**:
    1. Create an IAM user with programmatic credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) and attach S3 and SQS full access policy permissions.
    2. Create an AWS S3 Bucket and enable CORS configuration for presigned uploads.
    3. Create an AWS SQS Standard Queue.
    4. For local offline emulation, map these variables to `localhost:9324` as configured in the template.

---

### 2. Frontend Setup (`frontend/.env`)

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL="http://localhost:3000"

# Firebase Client SDK Credentials
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_SENDER_ID=""
VITE_FIREBASE_APP_ID=""
```

#### How to obtain Frontend parameters:
*   **VITE_API_URL**: Points the React proxy client to your backend server. Use `http://localhost:3000` for local runs, or your CDK API Gateway distribution URL in production.
*   **VITE_FIREBASE SDK Config**:
    1. Open your project in the [Firebase Console](https://console.firebase.google.com/).
    2. Click the **Gear Icon** (next to Project Overview) ➔ **Project Settings** ➔ **General**.
    3. Under **Your Apps**, add a web application to get the configurations code block containing the API Key, Auth Domain, Project ID, Storage Bucket, Messaging Sender ID, and App ID.
    4. Go to **Authentication** (in sidebar) and enable the **Email/Password** and **Google** Sign-In providers. Add your staging domains to the **Authorized Domains** list.
    5. Go to **Firestore Database** and create a database instance in production or test mode.

---

## 🚀 Running Locally (Docker-Compose Sandbox)

You can run the entire application, database migration, and background workers locally. The project includes a `/local-services` folder providing offline emulators for SQS, Redis, and Postgres via Docker Compose.

1.  **Install dependencies across all directories**:
    ```bash
    npm run install:all
    ```

2.  **Spin up local Docker dependencies (PostgreSQL, Redis, SQS/ElasticMQ)**:
    Navigate to the `local-services` directory and boot the containers:
    ```bash
    cd local-services
    docker-compose up -d
    ```
    This launches:
    *   **PostgreSQL** (`localhost:5432`)
    *   **Redis Cache** (`localhost:6379`)
    *   **ElasticMQ SQS Emulator** (`localhost:9324` API, `localhost:9325` management page)
    *   **pgAdmin Database Browser** (`localhost:5050`)
    *   **Redis Commander Cache Browser** (`localhost:8081`)

3.  **Initialize PostgreSQL Database & run Migrations**:
    Open a new terminal, navigate to `/backend`, and execute Prisma migrations:
    ```bash
    cd backend
    npm run db:migrate
    ```

4.  **Boot Frontend, Backend, and Background Worker concurrently**:
    From the root directory of the project, run:
    ```bash
    npm run dev:all
    ```
    *   **Frontend Client**: `http://localhost:5173`
    *   **Backend API**: `http://localhost:3000`
    *   **API Health Status**: `http://localhost:3000/health`

---

## ☁️ Deploying to AWS (Infrastructure as Code)

To deploy the entire serverless architecture (S3 Bucket, CloudFront CDN, SQS queue, API Gateway, and Lambda Function) to AWS:

1.  **Configure AWS CLI credentials** in your terminal.
2.  **Navigate to the `/infra` folder**:
    ```bash
    cd infra
    ```
3.  **Synthesize CloudFormation templates**:
    ```bash
    npx cdk synth
    ```
4.  **Deploy Stack to AWS**:
    ```bash
    npx cdk deploy
    ```
    *CDK will output your CloudFront Distribution URL (Frontend) and API Gateway Base URL (Backend API).*
