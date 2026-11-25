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

#### Android Studio on macOS

Open `mobile/android` as the Gradle project. Quit Android Studio first, then
double-click `mobile/open-android-studio.command`, or run it from Terminal:

```bash
./mobile/open-android-studio.command
```

The launcher supplies Node.js on Android Studio's PATH. Expo's autolinking
plugins invoke `node` directly, even when the app's Gradle configuration sets
`NODE_BINARY`. After Gradle sync succeeds, start Metro with `npm start` from
`mobile/`, select an emulator in Android Studio, and run the `app` configuration.

Keep `expo-system-ui` on the Expo SDK 54 compatible `~6.0.9` range specified
in `mobile/package.json`. Version `58.0.7` fails this SDK's Gradle autolinking
with a missing publication `version` error.

#### Signed Android release bundle

Local release signing reads `mobile/android/keystore.properties`, with the
fields `storeFile`, `storePassword`, `keyAlias`, and `keyPassword`. Relative
keystore paths are resolved from `mobile/android`. The local upload key is
`mobile/android/.signing/medterm-upload.p12`; both it and the properties file
are ignored by Git. Keep a secure backup of both outside the repository.
Missing credentials cause release builds to fail instead of using the debug key.

Build the signed bundle against the hosted API:

```bash
cd mobile/android
EXPO_PUBLIC_API_URL=https://medtermrx-1.onrender.com/api NODE_ENV=production ./gradlew :app:bundleRelease --max-workers=2
```

The result is `app/build/outputs/bundle/release/app-release.aab`. This local
signing setup is separate from EAS-managed credentials. Once an upload key is
registered with Google Play, reuse it for all subsequent uploads, including
EAS builds. Increase the native `versionCode` for each new Play upload.

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

| Method | Path                         | Description                                                                                        |
| ------ | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| GET    | `/api/terms`                 | List lightweight `SearchTerm` records |
| GET    | `/api/terms/search`          | Search terms; supports `?q=` and `?limit=`                                                         |
| POST   | `/api/terms/scan`            | Scan text and return matching terms                                                                |
| POST   | `/api/ocr`                   | Accept an image in the multipart form field `image` and return recognized text                     |
| GET    | `/api/terms/confusables/all` | All confusable pairs; optional `?termId=`                                                          |
| GET    | `/api/terms/random`          | Get random terms; supports `?category=` and `?count=`                                              |
| GET    | `/api/terms/quiz`            | Get quiz questions; supports `?category=` and `?count=`                                            |
| GET    | `/api/terms/:id`             | Get a full `Term` record, including `parts` and `pronunciation`                                    |
| GET    | `/api/roots`                 | List roots and affixes; supports `?category=`, `?type=`, `?q=`                                     |
| GET    | `/api/roots/categories`      | List available root categories                                                                     |
| GET    | `/api/roots/:id`             | Get a single root entry                                                                            |
| GET    | `/api/progress/:userId`      | Load saved progress for a user                                                                     |
| PUT    | `/api/progress/:userId`      | Save review deck progress                                                                          |

`GET /api/terms` returns lightweight `SearchTerm` records for listing and
matching. Fetch `GET /api/terms/:id` when full details such as `parts`,
`plainDefinition`, and `pronunciation` are needed.

### Medical data source

The backend loads medical terminology data from Amazon S3. Local JSON files
under `backend/data/` are not used by the application at runtime.

The S3 objects are configured with:

- `S3_BUCKET_NAME` — required bucket name
- `AWS_REGION` — optional; defaults to `us-east-1`
- `S3_TERMS_KEY` — optional full-term dataset; defaults to `data/terms.json`
- `S3_TERMS_LITE_KEY` — optional search/list dataset; defaults to
  `data/terms/terms-lite.json`
- `S3_TERMS_INDEX_KEY` — optional byte-range index for full-term lookups;
  defaults to `data/terms.index.json`
- `S3_ROOTS_KEY` — optional; defaults to `data/roots.json`
- `S3_CONFUSABLES_KEY` — optional; defaults to `data/confusables.json`

AWS credentials are resolved through the standard AWS credential chain and
must not be committed to the repository.



## Mobile app features

- **Study dashboard** — See how many cards are due, how many are in your
  deck, and how many you've mastered. Open a review session or jump into
  a study tool.
- **Scan & Dissect** — Capture medical text with the camera, edit the text
  recognized by OCR, or enter text manually. Open a matched term to see
  its breakdown. The native app uses on-device ML Kit, and the web app
  sends the captured image to the backend for OCR.
- **Word Dissector** — Search or browse terms alphabetically and filter by
  category. Open a term to see its definition, plain-language explanation,
  word parts, and pronunciation where available. Some terms also show
  memory aids or related terms. Add terms to your review deck from their
  detail pages.
- **Flashcards and quizzes** — Open a flashcard deck or take a
  multiple-choice definition quiz from the Word Dissector. Use the
  selected category to focus your practice and see your score after a quiz.
- **Spaced repetition** — Review due cards with exercises such as spelling,
  root recall, and confusable-term checks. Rate each answer to schedule
  its next review.
- **Confusables** — Compare look-alike and sound-alike medical terms side by
  side, and open either term for a closer look.
- **Root Library** — Search prefixes, roots, suffixes, abbreviations, and
  acronyms by text or meaning. Filter by type and see body systems and
  mnemonic cues where available.
- **Memory Map** — Tap a body region on the anatomy map, browse its terms,
  and write personal mnemonic notes. The map tracks which terms in each
  region have notes.
- **Local study progress** — Review cards, scheduling progress, and
  mnemonic notes are saved on the device or in the browser.

On the web, the Word Dissector stores the selected category in the URL,
for example `/dashboard/dissector?category=cardiovascular`. Opening or
reloading that URL restores the filter. Selecting **All** clears the
category parameter. Missing or unrecognized categories show all terms.


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

Run these commands from `mobile/`:

- `npm run web` — start the Expo development server for web.
- `npm run typecheck` — check TypeScript types without generating output files.

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
