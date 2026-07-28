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

### Medical data source

The backend loads medical terminology data from Amazon S3. Local JSON files
under `backend/data/` are not used by the application at runtime.

The S3 objects are configured with:

- `S3_BUCKET_NAME` — required bucket name
- `AWS_REGION` — optional; defaults to `us-east-1`
- `S3_TERMS_KEY` — optional; defaults to `data/terms/terms-lite.json`
- `S3_ROOTS_KEY` — optional; defaults to `data/roots.json`
- `S3_CONFUSABLES_KEY` — optional; defaults to `data/confusables.json`

AWS credentials are resolved through the standard AWS credential chain and
must not be committed to the repository.

### Backend scripts

- `backend/scripts/validate-medical-data.ts`

Validate the configured S3 datasets without writing local data:

```bash
cd backend
npm run validate:data
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
- Terms, roots, and confusables are loaded from S3 and cached in backend memory
- Validate updated S3 datasets with `npm run validate:data` from `backend/`

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
npm run expo:build
```

`expo:build` exports and deploys the web application. Run it only when a
production deployment is intended.

### Production backend build

```bash
cd backend
npm run build
npm start
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

