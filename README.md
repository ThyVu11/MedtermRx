# MedTermRx

![Version 2.0.0](https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge)

MedTermRx is a TypeScript study app for medical terminology. It pairs an Expo-powered React Native mobile client with a lightweight Express backend to support flashcards, quizzes, root lookup, OCR scanning, and confusable term review.

## Project overview

- `backend/` — Node.js + TypeScript REST API
- `mobile/` — Expo React Native application

## What MedTermRx does

- Search and explore medical terms, roots, prefixes, and suffixes
- Study with flashcards and spaced-repetition review
- Take multiple-choice quizzes
- Scan text and match medical terms automatically
- Review confusable term pairs and look-alike words
- Persist progress locally on the mobile device

## Tech stack

- Backend: Node.js, Express, TypeScript
- Mobile: Expo, React Native, TypeScript
- State management: Redux Toolkit
- Validation: Zod
- Storage: AsyncStorage
- Build/runtime: tsx, ts-node-dev, TypeScript

## Setup

### 1. Start the backend

```bash
cd backend
npm install
npm run dev
```

Default API URL:

```bash
http://localhost:3000/api
```

Verify with:

```bash
curl http://localhost:3000/api/terms
```

### 2. Start the mobile app

```bash
cd mobile
npm install
npm start
```

Expo Dev Tools will open. Then:

- Press `i` to open the iOS simulator on macOS
- Press `a` to open the Android emulator
- Scan the QR code with Expo Go to open on a physical device

### 3. Configure backend access

The mobile app uses `EXPO_PUBLIC_API_URL` from `mobile/.env` or `mobile/.env.local`.

Example `mobile/.env` values:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

The mobile client resolves the backend URL in `mobile/src/api/client.ts`.

Common cases:

- iOS simulator: `http://localhost:3000/api` usually works
- Android emulator: use `http://10.0.2.2:3000/api`
- Physical device: set `EXPO_PUBLIC_API_URL` to the host machine's LAN IP and keep both devices on the same network

To use a different environment for production or deployment, set `EXPO_PUBLIC_API_URL` in `mobile/.env.local`.

## Backend API

### Main endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/terms` | List terms; supports `?category=` and `?q=` |
| GET | `/api/terms/search` | Search terms; supports `?q=` and `?limit=` |
| POST | `/api/terms/scan` | Scan text and return matching terms |
| GET | `/api/terms/confusables/all` | All confusable pairs; optional `?termId=` |
| GET | `/api/terms/random` | Get random terms; supports `?category=` and `?count=` |
| GET | `/api/terms/quiz` | Get quiz questions; supports `?category=` and `?count=` |
| GET | `/api/terms/:id` | Get a single term |
| GET | `/api/roots` | List roots and affixes; supports `?category=`, `?type=`, `?q=` |
| GET | `/api/roots/categories` | List available root categories |
| GET | `/api/roots/:id` | Get a single root entry |
| GET | `/api/progress/:userId` | Load saved progress for a user |
| PUT | `/api/progress/:userId` | Save review deck progress |

### Data files

- `backend/data/terms/` — medical term data
- `backend/data/rootss/` — roots, prefixes, and suffixes
- `backend/data/confusables/confusables.json` — confusable term pairs

### Backend scripts

- `backend/scripts/build-lite-terms.js`
- `backend/scripts/build-medical-data.ts`
- `backend/scripts/validate-medical-data.ts`
- `backend/scripts/update-roots-from-appendices.ts`
- `backend/scripts/migrate-root-examples.ts`
- `backend/scripts/migrate-term-categories.ts.ts`

Common commands:

```bash
npm run validate:data
npm run build:data
npm run prepare:data
npm run download:mesh
npm run download:mesh:force
```

## Mobile app features

- Review dashboard with due count, mastery progress, and deck statistics
- Spaced repetition study sessions
- Term scanner and OCR-based match discovery
- Term dissector with prefix/root/suffix breakdown
- Root library for browsing medical affixes
- Confusable term review
- Local progress persistence via AsyncStorage

## Development notes

- The backend currently stores progress data in memory at `backend/src/routes/progress.ts`
- The mobile app stores deck progress locally in `mobile/src/utils/deckStorage.ts`
- To expand the app, update JSON data files in `backend/data/` and rebuild the backend as needed

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

### Mobile release / production scripts

```bash
cd mobile
npm run build
npm run expo:build
```

### Production backend build

```bash
cd backend
npm run build
npm start
```

### Generate MeSH term data

From the project root:

```bash
python generate_mesh_terms.py
```

This downloads the MeSH ZIP into `.mesh-cache/`, extracts XML, and generates `terms.json` and `terms.index.json`.

Optional example:

```bash
python generate_mesh_terms.py --output mesh-terms.json --merge curated_terms.json
```

## Notes

- This app is a lightweight medical terminology study tool, not a full learning management system
- Authentication is not included yet
- The backend and mobile client are designed to be replaceable independently

## Screenshots

![Dashboard screenshot](images/v1/Screenshot%202026-07-11%20at%2011.30.39%E2%80%AFPM.png)

![Quiz screenshot](images/v1/Screenshot%202026-07-11%20at%2011.30.50%E2%80%AFPM.png)

![Scanner screenshot](images/v1/Screenshot%202026-07-11%20at%2011.31.01%E2%80%AFPM.png)

![Confusables screenshot](images/v1/Screenshot%202026-07-11%20at%2011.31.15%E2%80%AFPM.png)


