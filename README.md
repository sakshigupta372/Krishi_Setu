# Krishi Setu

IoT-based smart agriculture monitoring and irrigation control system.

## Project Structure

- `backend` - Node.js + Express API for sensor data, auth, and irrigation control
- `dashboard` - React + Vite frontend dashboard for monitoring and control
- `hardware` - ESP32/firmware related files

## Prerequisites

- Node.js 16+
- npm

## Setup

### 1) Backend

```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:5000`.

### 2) Dashboard

```bash
cd dashboard
npm install
npm start
```

Dashboard runs on `http://localhost:3000`.

## Common Commands

- Backend development mode:

```bash
cd backend
npm run dev
```

- Frontend production build:

```bash
cd dashboard
npm run build
```

## Notes

- Dashboard expects backend API at `/api` (proxied in local development).
- If hardware is not connected, backend can still run for development/testing.
