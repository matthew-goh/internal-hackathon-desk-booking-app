# Mercator Office Booking — developer guide

A POC re-imagining the office booking experience. Built for the Mercator
hackathon. Single-page React app, no backend — all data is fake and loaded from
JSON at startup.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
npm run typecheck  # tsc --noEmit
```

Node 18+. No env vars, no API keys, no database.

## Stack

Vite · React 19 · TypeScript · Tailwind v4 (`@tailwindcss/vite`, no config file) ·
Zustand. SVG for the floor map. Avatars are DiceBear URLs (needs network to show
faces; degrades to empty circles offline).

## How it's wired

```
data/                 ← single source of truth (see data/SCHEMA.md)
  users · teams · office · bookings · config (JSON)
src/
  data/
    types.ts          ← types mirroring the JSON
    index.ts          ← the ONE place JSON is imported; everything else imports from here
  store.ts            ← Zustand state (date, current user, view, bookings) + pure selectors
  lib/
    status.ts         ← booking-status colours + helpers
    carbon.ts         ← carbon model (commute → CO₂ saved)
  components/
    AppShell.tsx      ← nav, date picker, "view as" user switcher
    SpaceMap.tsx      ← the SVG floor plan
    DayRoster.tsx     ← who's-in sidebar
    BookingPanel.tsx  ← book / manage drawer
    panels/           ← Floor, Today (what's busy), Insights, Carbon, Profile
```

**Golden rule:** components never read JSON directly — they import typed data
from `src/data` and live state from `src/store`. To change the office, edit the
JSON in `data/`; the UI follows.

### Store gotcha (read before touching `store.ts`)

Derived data (filtered arrays) lives in **pure selector functions**
(`bookingsOnDate`, `floorsVisibleTo`, …) that components call in the render body
after subscribing to raw state. Do **not** call array-returning helpers inside a
`useApp((s) => …)` selector — a new array every render breaks
`useSyncExternalStore` equality and infinite-loops the app.

## Where each goal lives

| Goal | Code |
|------|------|
| 1 · Co-owned bookings | `BookingPanel.tsx` + `book/release/checkIn/reassign` in `store.ts` |
| 2 · What's "busy" | `panels/TodayPanel.tsx` |
| 3 · Who booked what | `SpaceMap.tsx` hover cards + `DayRoster.tsx` |
| 4 · Visual office + avatars | `SpaceMap.tsx`, `data/office.json` |
| 4 · Streaks & badges | `panels/ProfilePanel.tsx` + `lib/streaks.ts` |
| Carbon Negative | `panels/CarbonPanel.tsx` + `lib/carbon.ts` |
| Access tiers / the Apartment | `config.json` + `canBookSpace`/`floorsVisibleTo` |

## Demo notes

- Data centres on **Thu 18 Jun 2026**. The week (Mon–Fri) is shaped so each day
  reads differently: Tue = Engineering team day, Wed = peak, Mon/Fri = quiet.
- Use **"View as"** (top right) to switch roles — a regular user can't see the
  Apartment or book privileged rooms; switch commute profiles to see carbon change.
- Bookings are in-memory and reset on refresh (intentional for a POC).
