# ATLAS — Landslide Risk Monitoring & Early Warning Platform

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-orange.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Frontend-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%2020+-green.svg)](https://nodejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8.svg)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Geospatial-Leaflet-10b981.svg)](https://leafletjs.com/)
[![Socket.IO](https://img.shields.io/badge/Real--Time-Socket.IO-white.svg)](https://socket.io/)

A production-minded, full-stack disaster intelligence web application built with the **MERN** stack (MongoDB, Express.js, React.js with Vite, and Node.js). Designed under the visual philosophy of **“Cinematic Earth Intelligence”**, ATLAS synthesizes hydrological telemetry, pore-water pressure dynamics, and bi-axial slope shearing to calculate transparent, real-time hazard ratings before slope failure occurs.

---

## Table of Contents

1. [Product Vision & Visual Identity](#1-product-vision--visual-identity)
2. [Architecture & System Design](#2-architecture--system-design)
3. [Technology Stack](#3-technology-stack)
4. [Quickstart (Local Development in 2 Minutes)](#4-quickstart-local-development-in-2-minutes)
5. [Database Modes: Embedded Zero-Config vs. MongoDB Atlas](#5-database-modes-embedded-zero-config-vs-mongodb-atlas)
6. [Pre-Seeded Demonstration Dataset & Demo Accounts](#6-pre-seeded-demonstration-dataset--demo-accounts)
7. [Telemetry Ingestion Workflow & Edge Hardware Integration](#7-telemetry-ingestion-workflow--edge-hardware-integration)
8. [The Landslide Hazard Index (LHI-v2.2) Formula](#8-the-landslide-hazard-index-lhi-v22-formula)
9. [REST API Documentation](#9-rest-api-documentation)
10. [Socket.IO Real-Time Telemetry Protocol](#10-socketio-real-time-telemetry-protocol)
11. [Testing & Quality Verification](#11-testing--quality-verification)
12. [Cloud Production Deployment Guide](#12-cloud-production-deployment-guide)
13. [Final Deliverable Verification Checklist](#13-final-deliverable-verification-checklist)

---

## 1. Product Vision & Visual Identity

### “Cinematic Earth Intelligence”
Inspired by high-end geospatial aerospace intelligence and environmental monitoring platforms:
- **Palette**: Deep charcoal (`#06090e`), midnight graphite (`#0b0f17`), and slate blue (`#161f31`), with vivid hazard accents:
  - **Low Hazard**: Emerald Green (`#10b981`)
  - **Moderate Hazard**: Amber Yellow (`#f59e0b`)
  - **High Hazard**: Volcanic Orange (`#f97316`)
  - **Critical Hazard**: Signal Crimson (`#ef4444`) with pulse animation
- **Textures & Shading**: Elevation shading, subtle topographic contour lines, thin borders (`border-earth-700/80`), and backdrop-blur glass panels (`backdrop-blur-md`).
- **Accessibility**: Colors are always accompanied by textual labels, metric percentages, and SVG iconography. Animations respect `prefers-reduced-motion`.

---

## 2. Architecture & System Design

```
                     ┌───────────────────────────────────────────┐
                     │         EDGE IOT SENSOR MESH              │
                     │  - TDR Soil Moisture                      │
                     │  - MEMS Bi-Axial Tiltmeters               │
                     │  - Optical Tipping Rain Gauges            │
                     │  - Vibrating Wire Piezometers             │
                     └─────────────────────┬─────────────────────┘
                                           │ HTTP POST / MQTT Bridge
                                           │ (Authenticated with x-sensor-key)
                                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        NODE.JS / EXPRESS BACKEND                       │
│                                                                        │
│  ┌───────────────────────┐   ┌──────────────────────────────────────┐  │
│  │   Ingestion Service   │──▶│   Landslide Hazard Index (LHI-v2.2)  │  │
│  │  - Bounds Validation  │   │  - Dynamic Weight Balancing          │  │
│  │  - Staleness Watchdog │   │  - Slope Amplification Multiplier    │  │
│  └───────────┬───────────┘   └──────────────────┬───────────────────┘  │
│              │                                  │                      │
│              ▼                                  ▼                      │
│  ┌───────────────────────┐   ┌──────────────────────────────────────┐  │
│  │     Alert Service     │   │         Socket.IO Manager            │  │
│  │  - Deduplication Key  │   │  - Broadcasts: reading:new           │  │
│  │  - 15-Minute Cooldown │   │  - Broadcasts: assessment:updated    │  │
│  │  - Ack/Resolve States │   │  - Broadcasts: alert:new             │  │
│  └───────────────────────┘   └──────────────────┬───────────────────┘  │
└──────────────────┬──────────────────────────────┼──────────────────────┘
                   │ Mongoose Models              │ WebSockets
                   ▼                              ▼
    ┌─────────────────────────────┐  ┌─────────────────────────────────┐
    │  MONGODB (ATLAS OR MEMORY)  │  │     REACT + VITE FRONTEND       │
    │  - Locations                │  │  - Geospatial Leaflet Map       │
    │  - Sensors                  │  │  - Executive Dashboard          │
    │  - SensorReadings (Indexed) │  │  - In-Situ Sensor Registry      │
    │  - RiskAssessments          │  │  - LHI Transparency Studio      │
    │  - Alerts                   │  │  - Alarm Incident Center        │
    │  - AuditLogs                │  │  - CSV Export & Longitudinal    │
    └─────────────────────────────┘  │  - Simulation Drawer Console    │
                                     └─────────────────────────────────┘
```

---

## 3. Technology Stack

### Frontend (`client/`)
- **React 18** with **Vite** and **TypeScript**.
- **Tailwind CSS** with a custom cinematic color tokens (`earth-*`, `risk-*`).
- **React Router DOM v6** for client routing.
- **Leaflet & React-Leaflet** for interactive mapping, tile switching (Carto Voyager / Dark / OSM), and custom SVG risk pins.
- **Recharts** for multi-sensor longitudinal trends and risk distribution charts.
- **Socket.IO Client** for real-time live telemetry feeds.
- **Lucide React** for consistent interface iconography.

### Backend (`server/`)
- **Node.js 20+** with **Express.js**.
- **MongoDB** with **Mongoose 8** schemas, compound indexes, and auto-seeding.
- **Socket.IO** server for live multi-room telemetry broadcasts.
- **JSON Web Tokens (JWT)** and **bcryptjs** password hashing.
- **Zod** for schema and payload validation.
- **Helmet, CORS, Morgan**, and **express-rate-limit** security defenses.
- **mongodb-memory-server** for zero-setup automatic local fallback.
- **Vitest** for backend unit and integration testing.

---

## 4. Quickstart (Local Development in 2 Minutes)

### Prerequisites
- Node.js `v18.0.0` or higher (`v20+` recommended)
- npm `v9+`

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/landslide-monitoring-platform.git
cd landslide-monitoring-platform
```

### Step 2: Install Server & Client Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 3: Run the Application Locally
In two separate terminal windows (or tabs):

```bash
# Terminal 1: Start Backend (Port 5000)
cd server
npm start
```
> **Zero Configuration Notice**: If no local MongoDB service is running, the server automatically starts an embedded MongoDB in-memory instance and auto-seeds the demonstration dataset on first launch.

```bash
# Terminal 2: Start Frontend (Port 5173)
cd client
npm run dev
```

Open your browser at: **`http://localhost:5173/`**

---

## 5. Database Modes: Embedded Zero-Config vs. MongoDB Atlas

The platform is designed to run anywhere without configuration roadblocks:

### Mode A: Embedded In-Memory MongoDB (Default Fallback)
- If `MONGODB_URI` is not provided or local MongoDB cannot be reached, the server starts an embedded instance using `mongodb-memory-server`.
- The database is immediately populated with 6 real-world slope sections, 24 sensor nodes, 48 hours of time-series readings, and active emergency alerts.

### Mode B: MongoDB Atlas (Recommended for Cloud Production)
To connect to your cloud cluster on MongoDB Atlas:
1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Go to **Database Access** -> create a database user and password.
3. Go to **Network Access** -> Add IP address `0.0.0.0/0` (or your host IP).
4. Click **Connect** -> **Connect your application** -> Copy the connection string.
5. In `server/.env`, set:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/landslide_db?retryWrites=true&w=majority
   USE_MEMORY_DB=false
   ```
6. Restart the backend server. The database will automatically initialize and persist across reboots.

---

## 6. Pre-Seeded Demonstration Dataset & Demo Accounts

The application includes realistic demonstration locations across known high-risk mountainous terrain:

| Code | Location Name | Region | Slope | Geology Profile | Initial Hazard |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **WY-MEP-01** | Wayanad Meppadi Ridge | Western Ghats, Kerala | 38° | Weathered Laterite over Gneiss | **High** (68/100) |
| **JM-RAV-02** | Joshimath Ravigram Escarpment | Garhwal Himalayas, Uttarakhand | 44° | Sheared Mica-Schist Colluvium | **Critical** (82/100) |
| **WA-OSO-03** | Oso Cascadia River Bend | Snohomish County, Washington | 32° | Glacial Till & Lacustrine Silts | **Moderate** (42/100) |
| **CH-BRZ-04** | Brienz Brinzauls Insel Flank | Albula Valley, Grisons (Swiss Alps) | 51° | Fractured Dolomite & Anhydrite | **High** (71/100) |
| **HP-SHM-05** | Shimla Dhalli Ridge Flank | Shimla Ridge, Himachal Pradesh | 34° | Jutogh Group Phyllites | **Moderate** (36/100) |
| **TN-CNR-06** | Coonoor Marapalam Ghat | Nilgiri Biosphere, Tamil Nadu | 26° | Engineered Soil Retention Terraces | **Low** (18/100) |

### Demonstration Accounts (One-Click Login available on `/login`):

| Role | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@landslide.io` | `Admin@123456` | Full system access, Sensor creation/deletion, Audit logs |
| **Operator** | `operator@landslide.io` | `Operator@123456` | Alert acknowledgement/resolution, Telemetry calibration |
| **Viewer** | `viewer@landslide.io` | `Viewer@123456` | Read-only access to maps, charts, and public bulletins |

---

## 7. Telemetry Ingestion Workflow & Edge Hardware Integration

ATLAS exposes an authenticated telemetry ingestion endpoint for physical IoT dataloggers or edge microcontrollers (ESP32, Raspberry Pi, LoRaWAN gateways).

### Ingestion API Endpoint
`POST /api/readings/ingest`

**Headers:**
```http
Content-Type: application/json
x-sensor-key: landslide_edge_telemetry_secure_key_9981
```

**Payload:**
```json
{
  "sensorId": "SEN-WY-MEP-01-RAIN",
  "value": 52.4,
  "unit": "mm/h",
  "observedAt": "2026-10-17T04:30:00.000Z",
  "dataSource": "edge_http",
  "metadata": {
    "batteryVoltage": 3.92,
    "signalRssi": -68
  }
}
```

### Ingestion Lifecycle:
1. **Authentication**: Validates device pre-shared key or JWT token.
2. **Bounds & Staleness Check**: Validates physics limits (e.g., rainfall $0-350$ mm/h, moisture $0-100\%$, tilt $\pm 90^\circ$).
3. **Database Persistence**: Stores indexed time-series reading in `SensorReading` collection.
4. **Sensor State Update**: Marks sensor as `online` and updates last seen timestamp.
5. **LHI Recalculation**: Gathers surrounding location telemetry and computes fresh Landslide Hazard Index.
6. **Alert Rule Evaluation**: Evaluates warning/critical thresholds with 15-minute cooldown deduplication.
7. **WebSocket Broadcast**: Emits `reading:new`, `assessment:updated`, and `alert:new` to all connected web clients.

---

## 8. The Landslide Hazard Index (LHI-v2.2) Formula

The risk engine is isolated in `server/src/services/hazardIndexService.js`.

### Mathematical Formulation

$$\text{LHI} = \left( \sum_{i} w_i \cdot S_i \right) \cdot \kappa_{\text{slope}} - P_{\text{stale}}$$

Where:
- $S_{\text{rain}}$: Normalized rainfall intensity score ($0 - 100$), weight $w_{\text{rain}} = 0.35$
- $S_{\text{soil}}$: Normalized volumetric soil moisture saturation ($0 - 100$), weight $w_{\text{soil}} = 0.25$
- $S_{\text{tilt}}$: Normalized bi-axial displacement/tilt rate ($0 - 100$), weight $w_{\text{tilt}} = 0.25$
- $S_{\text{pore}}$: Normalized pore-water hydrostatic uplift ($0 - 100$), weight $w_{\text{pore}} = 0.15$
- $\kappa_{\text{slope}}$: Topographic slope angle multiplier:
  $$\kappa_{\text{slope}} = \frac{\sin(\theta)}{\sin(30^\circ)} \quad \text{clamped to } [0.70, 1.35]$$
- $P_{\text{stale}}$: Data freshness uncertainty deduction ($4$ points per stale sensor, max $15$).

### Categorical Risk Classification

| LHI Score | Risk Level | Status & Operational Action | Accent Color |
| :--- | :--- | :--- | :--- |
| **0.00 – 29.99** | **Low** | Normal background conditions; routine telemetry monitoring. | Emerald Green |
| **30.00 – 54.99** | **Moderate** | Elevated soil moisture or rain; heightened observation protocol. | Amber Yellow |
| **55.00 – 74.99** | **High** | Critical saturation and surface creep; advisory warnings dispatched. | Volcanic Orange |
| **75.00 – 100.0** | **Critical** | Imminent shear failure; automated alarm and evacuation watch. | Signal Crimson |

> **Scientific Transparency Notice**: The Landslide Hazard Index is an empirical heuristic decision-support indicator designed to assist civil protection and geotechnical operators. It does not constitute a certified prediction of slope failure.

---

## 9. REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new operator.
- `POST /api/auth/login` — Sign in and receive JWT token.
- `GET /api/auth/me` — Get authenticated session profile.
- `POST /api/auth/logout` — Revoke session.

### Locations (`/api/locations`)
- `GET /api/locations` — List all locations with risk scores and sensor counts.
- `GET /api/locations/:id` — Get single location with attached sensors and latest assessment.
- `POST /api/locations` — Create new monitored location (*Admin/Operator*).
- `PUT /api/locations/:id` — Update location specifications (*Admin/Operator*).
- `DELETE /api/locations/:id` — Delete location (*Admin*).

### Sensors (`/api/sensors`)
- `GET /api/sensors` — List all sensors with query filters (`location`, `type`, `status`).
- `GET /api/sensors/:id` — Get sensor details and recent 60 telemetry points.
- `POST /api/sensors` — Register new sensor node (*Admin/Operator*).
- `PUT /api/sensors/:id` — Update warning/critical thresholds and depth (*Admin/Operator*).
- `DELETE /api/sensors/:id` — Remove sensor (*Admin*).

### Readings & Ingestion (`/api/readings`)
- `POST /api/readings/ingest` — Ingest single sensor reading (*Device Key or JWT*).
- `POST /api/readings/batch` — Batch ingest up to 100 readings.
- `GET /api/readings` — Query readings with pagination and time bounds.

### Risk Assessments (`/api/assessments`)
- `GET /api/assessments/latest` — Latest assessments for all monitored slopes.
- `GET /api/assessments/config` — Inspect LHI formula, factor weights, and thresholds.
- `GET /api/assessments/location/:locationId` — Historical assessment trajectory.
- `POST /api/assessments/recalculate/:locationId` — Re-evaluate LHI on demand (*Operator*).

### Alerts & Notifications (`/api/alerts`)
- `GET /api/alerts` — Query active and historical alerts with severity/status filters.
- `GET /api/alerts/:id` — Get alert details and delivery channel statuses.
- `PUT /api/alerts/:id/acknowledge` — Operator acknowledges incident with notes (*Operator*).
- `PUT /api/alerts/:id/resolve` — Mark incident as resolved (*Operator*).

### Analytics & Reports (`/api/analytics`)
- `GET /api/analytics/dashboard` — Executive summary KPI metrics.
- `GET /api/analytics/trends` — 24h/7d/30d multi-sensor time-series for Recharts.
- `GET /api/analytics/export/csv` — Direct CSV download of geotechnical sensor readings.

### System & Health (`/api/system`)
- `GET /api/system/health` (or `GET /api/health`) — Uptime, service version, and database state.
- `GET /api/system/ready` — Readiness probe for Kubernetes / Docker orchestrators.
- `POST /api/system/simulate-pulse` — Trigger interactive simulation scenarios.
- `POST /api/system/reset` — Reset demonstration database to default baseline (*Admin*).
- `GET /api/system/audit-logs` — Administrative audit log explorer (*Admin*).

---

## 10. Socket.IO Real-Time Telemetry Protocol

The frontend automatically connects to the WebSocket stream on application load:

| Event Name | Direction | Payload Description |
| :--- | :--- | :--- |
| `reading:new` | Server $\to$ Client | Broadcasts newly accepted sensor reading with location and unit. |
| `assessment:updated` | Server $\to$ Client | Broadcasts newly computed LHI score and factor breakdown. |
| `alert:new` | Server $\to$ Client | Pushes emergency alert notification toast to active users. |
| `alert:acknowledged` | Server $\to$ Client | Updates alert state across all connected operator dashboards. |
| `alert:resolved` | Server $\to$ Client | Clears active alert banner when incident is marked resolved. |
| `sensor:status_change`| Server $\to$ Client | Broadcasts sensor transitions between `online`, `stale`, and `offline`. |

---

## 11. Testing & Quality Verification

### Run Backend Unit & Integration Tests:
```bash
cd server
npm test
```
**Results:**
- `✓ tests/hazardIndex.test.js` (6 tests passed)
  - Formula bounds, rainfall normalization, slope geometric factors, and stale input degradation.
- `✓ tests/alertService.test.js` (2 tests passed)
  - Threshold breach detection, alert creation, and 15-minute cooldown deduplication.

### Verify Production Frontend Build:
```bash
cd client
npm run build
```
**Results:**
- `✓ built in 10.57s` with zero TypeScript or asset compilation errors.

---

## 12. Cloud Production Deployment Guide

### Deploying the Backend on Render or Railway
1. Push your repository to GitHub.
2. In [Render](https://render.com) or [Railway](https://railway.app), create a new **Web Service**.
3. Set **Root Directory** to `server`.
4. Set **Build Command** to `npm install`.
5. Set **Start Command** to `node src/server.js`.
6. Add the following **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/landslide_db
   USE_MEMORY_DB=false
   JWT_SECRET=your_long_random_jwt_secret_key_here
   CLIENT_URL=https://your-frontend-domain.vercel.app
   SENSOR_INGESTION_KEY=your_secure_edge_ingestion_key
   ```
7. Deploy. Verify that `https://your-backend.onrender.com/api/health` returns `status: UP`.

### Deploying the Frontend on Vercel
1. In [Vercel](https://vercel.com), click **Add New Project** and select the repository.
2. Set **Root Directory** to `client`.
3. Set **Framework Preset** to `Vite`.
4. Add **Environment Variables**:
   ```env
   VITE_API_URL=https://your-backend.onrender.com/api
   VITE_SOCKET_URL=https://your-backend.onrender.com
   ```
5. Click **Deploy**. Vercel will build and serve the optimized static bundle.

### Deploying via Docker Compose:
To spin up the entire multi-container environment on an AWS EC2, DigitalOcean Droplet, or local machine:
```bash
docker compose up -d --build
```
- Frontend will be accessible at: `http://localhost:5173`
- Backend API will be accessible at: `http://localhost:5000`

---

## 13. Final Deliverable Verification Checklist

- [x] **Product Vision**: "Cinematic Earth Intelligence" dark aesthetic with high-density monitoring and accessible risk indicators.
- [x] **Frontend Architecture**: React 18, Vite, TypeScript, Tailwind CSS, Lucide icons, Recharts, and Leaflet.
- [x] **Backend Architecture**: Node.js, Express, MongoDB with Mongoose, JWT authentication, and Zod validation.
- [x] **Database Resilience**: MongoDB Atlas compatibility + zero-setup embedded MongoDB memory fallback.
- [x] **Public Landing Page**: Hero mountain visual, workflow pipeline, feature deep-dives, live stats counter, and footer.
- [x] **Operational Dashboard**: Total sensors, online/offline counts, monitored locations, risk distribution, 24h area trends, active alarms stream.
- [x] **Interactive Geospatial Map**: Leaflet map with custom SVG risk pins, Carto Voyager / Dark / OSM layers, synchronized location intelligence side panel.
- [x] **In-Situ Sensor Mesh Page**: Registry of Soil Moisture, Tiltmeter, Rain Gauge, and Piezometer sensors with gauges and configurable threshold settings.
- [x] **Risk Intelligence Page**: Transparent LHI-v2.2 formula explorer, factor breakdown ($S_{\text{rain}}, S_{\text{soil}}, S_{\text{tilt}}, S_{\text{pore}}, \kappa_{\text{slope}}$), and on-demand recalculation.
- [x] **Alert Incident Center**: Active and historical alarms, severity filtering, operator acknowledgement with notes, resolve workflow, delivery status indicators (In-App, SMS, Email).
- [x] **Analytics & Reports**: Longitudinal trend charts, correlation between rainfall bursts and pore pressure, and downloadable CSV reports.
- [x] **Authentication & Roles**: Administrator, Operator, Viewer roles with one-click demo login buttons.
- [x] **Audit Trail**: Administration action audit logging with actor, action, resource, and timestamp.
- [x] **Interactive Simulation Drawer**: Interactive floating drawer in the UI to trigger storm cloudbursts, dry spells, and reset demo data.
- [x] **Automated Tests**: Unit and integration test suite passing.
- [x] **Production Build**: Clean production build for client and server.
- [x] **Deployment Documentation**: Complete guides for Atlas, Render, Vercel, and Docker Compose.
