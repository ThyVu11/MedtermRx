# MedTerm Study

A TypeScript mobile app to help med students learn medical terminology through
flashcards and multiple-choice quizzes, backed by a small REST API.

- **mobile/** — React Native app (Expo + TypeScript)
- **backend/** — Node.js REST API (Express + TypeScript)

## 1. Run the backend

```bash
cd backend
npm install
npm run dev
```

This starts the API at `http://localhost:3000`. Try it: `http://localhost:3000/api/terms`.

### Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/terms` | All terms (optional `?category=`) |
| GET | `/api/terms/:id` | Single term |
| GET | `/api/terms/categories` | Categories with counts |
| GET | `/api/terms/random?count=10&category=` | Random terms for flashcards |
| GET | `/api/terms/quiz?count=10&category=` | Multiple-choice quiz questions |

Term data lives in `backend/src/data/terms.ts` — add more terms there any time,
no schema changes needed.

## 2. Point the app at your backend

Edit `mobile/src/api/client.ts` — the default `http://localhost:3000/api` only
works in the **iOS simulator**. Otherwise:

- **Android emulator** → `http://10.0.2.2:3000/api`
- **Physical phone (Expo Go)** → `http://<your-computer's-LAN-IP>:3000/api`
  (find it with `ipconfig getifaddr en0` on Mac, or `ipconfig` on Windows —
  your phone and computer must be on the same Wi-Fi network)

## 3. Run the mobile app

```bash
cd mobile
npm install
npm start
```

This opens the Expo dev tools. From there:
- Press `i` for the iOS simulator (Mac only, needs Xcode)
- Press `a` for the Android emulator (needs Android Studio)
- Scan the QR code with the **Expo Go** app on your phone for the fastest way
  to try it on a real device

## App features

- **Flashcards** — tap a card to flip between the term and its definition, with
  an example sentence for context
- **Quiz** — multiple-choice questions pulled from the term bank, with instant
  right/wrong feedback and a score summary
- **Browse by category** — Prefixes, Suffixes, Roots, and body-system term sets
  (Cardiovascular, Respiratory, Musculoskeletal, GI, Neuro) plus common
  abbreviations

## Notes

- No database — the backend keeps terms in memory for simplicity. Swap in
  Postgres/SQLite later without touching the mobile app, since it only talks
  to the REST endpoints.
- No auth/user accounts yet. If you want to track individual progress or
  spaced-repetition scheduling, that's a natural next step — happy to add it.
