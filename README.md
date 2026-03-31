# Thorax Study Platform

Full-stack role-based thorax imaging workflow for SGPGI / Dectrocel.

## What Changed

- Added a local Node/Express backend-for-frontend under `server/` to proxy the external API, keep the API key off the browser, normalize payloads, and persist radiology audit logs.
- Replaced the React frontend's mock auth and mock study data with real API-driven flows for login, study creation, clinical entry, radiology reporting, AI PDF upload, and patient profile retrieval.
- Added validation and workflow enforcement:
  - AI report upload is PDF-only.
  - Radiology reporting is a single textarea flow with auto-signing and audit log creation.
  - Pulmonary clinical form fields match the external API schema.
- Added CI in `.github/workflows/ci.yml`.

## Stack

- Frontend: React + Vite + TypeScript + React Query
- Backend: Node.js + Express
- External API: `http://54.252.216.233:8042`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local `.env` from `.env.example`:

```bash
PORT=3001
EXTERNAL_API_BASE_URL=http://54.252.216.233:8042
EXTERNAL_API_KEY=your-issued-api-key
RADIOLOGY_AUDIT_LOG_PATH=server/data/radiology-audit.json
```

3. Start both services:

```bash
npm run dev
```

- Frontend: `http://localhost:8080`
- Backend proxy: `http://localhost:3001`

## Vercel Deployment

This repository now includes:

- `api/[...route].js` for serverless `/api/*` handling on Vercel
- `vercel.json` for API routing plus SPA fallback to `index.html`

Required Vercel environment variables:

```bash
EXTERNAL_API_BASE_URL=http://54.252.216.233:8042
EXTERNAL_API_KEY=your-issued-api-key
RADIOLOGY_AUDIT_LOG_PATH=/tmp/radiology-audit.json
```

If `EXTERNAL_API_KEY` is missing in Vercel, login and all `/api/*` calls will fail.

4. Production-style run:

```bash
npm run build
npm start
```

## API Flow

The frontend calls the local proxy at `/api/...`.

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/studies`
- `POST /api/studies`
- `GET /api/studies/:crNo`
- `PUT /api/studies/:crNo/clinical`
- `PUT /api/studies/:crNo/radiology`
- `POST /api/studies/:crNo/ai-report`
- `POST /api/studies/:crNo/images`

The proxy then forwards requests to the external API with:

- `x-api-key`
- user bearer token from the login response

## Verification

Run:

```bash
npm run lint
npm test
npm run build
```

## Known External Dependency

The external API publishes OpenAPI docs at:

- `http://54.252.216.233:8042/docs`
- `http://54.252.216.233:8042/openapi.json`

During integration, the public bootstrap endpoint `POST /admin/seed-initial-admin` returned `500`, so live end-to-end auth verification still depends on valid API credentials already existing in the external system.
