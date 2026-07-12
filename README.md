# MedTermRx

![Version 1.0.0](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)

MedTermRx is a TypeScript study app for medical terminology. It combines an Expo-powered React Native mobile client with a lightweight Express backend to support flashcards, quizzes, root/term search, scanning, and confusable term review.

## Repository structure

- `backend/` — Node.js + TypeScript REST API
- `mobile/` — Expo React Native app

## Tech stack

- Backend: Node.js, Express, TypeScript
- Mobile: Expo, React Native, TypeScript
- State management: Redux Toolkit
- Data validation: Zod
- Storage: AsyncStorage
- Build/runtime tools: tsx, ts-node-dev, TypeScript

## What it does

- Search and explore medical terms, roots, prefixes, and suffixes
- Flip flashcards and track spaced-repetition review progress
- Take multiple-choice quizzes
- Scan text and match medical terms automatically
- Browse confusable term pairs and high-risk look-alikes
- Persist review deck state locally on the device

## Quickstart

### 1. Start the backend

```bash
cd backend
npm install
npm run dev
```

The backend listens on `http://localhost:3000` by default. Verify with:

```bash
curl http://localhost:3000/api/terms
```

### 2. Start the mobile app

```bash
cd mobile
npm install
npm start
```

This opens Expo Dev Tools. Then:

- Press `i` to open the iOS simulator (Mac only)
- Press `a` to open the Android emulator
- Scan the QR code with Expo Go to run on a physical device

### 3. Configure the API base URL

The mobile app loads the backend URL from `mobile/src/api/client.ts`:

```ts
const LAN_IP = process.env.LAN_IP || "localhost";
export const API_BASE_URL = `http://${LAN_IP}:3000/api`;
```

- For iOS simulator, `localhost` usually works
- For Android emulator, `LAN_IP=10.0.2.2` is often required
- For a real phone, set `LAN_IP` to your computer's LAN IP and keep both devices on the same network

## Backend features

The backend provides term, root, confusable, and progress APIs.

### Main endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/terms` | List terms; supports `?category=` and `?q=` |
| POST | `/api/terms/scan` | Scan text and return matching terms |
| GET | `/api/terms/confusables/all` | All confusable pairs; optional `?termId=` |
| GET | `/api/terms/:id` | Get a single term |
| GET | `/api/roots` | List roots and affixes; supports `?category=`, `?type=`, `?q=` |
| GET | `/api/roots/categories` | List available root categories |
| GET | `/api/roots/:id` | Get a single root entry |
| GET | `/api/progress/:userId` | Load saved deck progress for a user |
| PUT | `/api/progress/:userId` | Save review deck progress |

### Data and scripts

- Term and root data are stored in `backend/data/`
- Confusable pairs live in `backend/data/confusables/confusables.json`
- Extra scripts are available in `backend/scripts/`

Useful backend commands:

```bash
npm run validate:data
npm run build:data
npm run prepare:data
npm run download:mesh
npm run download:mesh:force
```

## Mobile app features

- Dashboard with due review count, deck size, and mastery progress
- Review session powered by spaced repetition
- Scanner tool that detects medical terms in free text
- Term dissector for prefix/root/suffix breakdown
- Root library for browsing prefixes, roots, and suffixes
- Confusables review for high-risk look-alike terms
- Local deck storage via AsyncStorage

## Development notes

- The backend does not use a persistent database; progress data is stored in memory in `backend/src/routes/progress.ts`
- The mobile app keeps review deck state on-device in `mobile/src/utils/deckStorage.ts`
- If you add terms or roots, update the JSON files under `backend/data/` and rebuild if needed

## Useful commands

### Backend

```bash
cd backend
npm install
npm run dev
```

### Mobile

```bash
cd mobile
npm install
npm start
```

### Build backend for production

```bash
cd backend
npm run build
npm start
```

### Build mobile data assets

```bash
cd mobile
npm run build:data
```

### Generate MeSH term data

From the repo root, run:

```bash
python generate_mesh_terms.py
```

This downloads the official 2026 MeSH ZIP once into `.mesh-cache/`, extracts the XML, and generates:

- `terms.json`
- `terms.index.json`

Optional flags:

```bash
python generate_mesh_terms.py --output mesh-terms.json --merge curated_terms.json
```

## Notes

- The app is designed as a lightweight study tool, not a full LMS
- No authentication is included yet
- The API and mobile client are separated so the backend can be replaced without changing the app

## Screenshots


![Dashboard screenshot](images/v1/Screenshot%202026-07-11%20at%2011.30.39%E2%80%AFPM.png)

![Quiz screenshot](images/v1/Screenshot%202026-07-11%20at%2011.30.50%E2%80%AFPM.png)

![Scanner screenshot](images/v1/Screenshot%202026-07-11%20at%2011.31.01%E2%80%AFPM.png)

![Confusables screenshot](images/v1/Screenshot%202026-07-11%20at%2011.31.15%E2%80%AFPM.png)


