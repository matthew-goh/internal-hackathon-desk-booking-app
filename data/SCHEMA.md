# Data Schema

All fake data lives in `/data` as plain JSON so it can be imported by any stack. Five files:

| File | What it holds |
|------|---------------|
| `config.json`   | App-wide settings: access tiers, co-ownership rule, carbon factors |
| `teams.json`    | The 8 teams, each with a brand colour and home zone |
| `users.json`    | 36 people — identity, role, streaks, commute profile |
| `office.json`   | Two floors (Main + the Apartment), their map layout and every space |
| `bookings.json` | ~70 bookings across one week, with realistic daily patterns |

---

## `users.json`

```jsonc
{
  "id": "u-07",                          // stable key, referenced by bookings
  "name": "Aisha Khan",
  "email": "aisha.khan@mercator.com",
  "team": "engineering",                 // → teams.json id  (needed for "what's busy")
  "title": "Senior Engineer",
  "accessRights": "user",                // user | manager | csuite | admin
  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=AishaKhan",
  "commute": { "mode": "tube", "distanceKm": 15 },   // powers carbon savings
  "streak": {
    "current": 9,        // consecutive fulfilled (checked-in) office days
    "longest": 9,
    "totalBookings": 51,
    "fulfilled": 50,     // checked in
    "noShows": 1,        // booked but never checked in
    "lastActive": "2026-06-18"
  }
}
```

### Access tiers (see `config.json` → `accessRights`)
| Tier | Book for others | See/book the Apartment | Manage anyone's booking |
|------|:---:|:---:|:---:|
| `user`    | ✗ | ✗ | ✗ |
| `manager` | ✓ | ✗ | ✗ |
| `csuite`  | ✓ | ✓ | ✗ |
| `admin`   | ✓ | ✓ | ✓ |

> **Co-ownership is separate from tiers.** Any user can assign a desk they booked to
> another person; both land in the booking's `owners[]` and can manage it. Tiers only
> gate booking-on-behalf at scale, Apartment access (`canAccessFlat`), and the admin override.

---

## `office.json`

A floor has a `map` (canvas size + background) and a flat list of `spaces`. Positions are
absolute pixels on that canvas, so the map renders straight from the data.

```jsonc
{
  "id": "main",
  "restricted": false,                   // the "flat" floor is restricted: csuite/admin only
  "map": { "width": 1200, "height": 760, "background": "#F8FAFC" },
  "zones": [ { "id": "A", "label": "North Wing", "team": "engineering", "x":100,"y":195,"width":320,"height":185 } ],
  "spaces": [ /* see below */ ]
}
```

### Space types
| `type` | Bookable | Extra fields |
|--------|:---:|--------------|
| `desk`    | ✓ | `zone`, `amenities[]` |
| `room`    | ✓ | `seats`, `width`/`height`, `amenities[]` |
| `pod`     | ✓ | `seats: 1` |
| `lounge`  | ✗ (`bookable:false`) | `seats` |
| `kitchen` | ✗ | — shown on the map for orientation only |

> **IDs vs labels:** desk `id`s stay stable (`D01`–`D32`) so bookings never break;
> their `label` is the real office desk number (`"1"`–`"32"`). Rooms use real names.

```jsonc
{ "id": "D01", "type": "desk", "label": "1", "zone": "A",
  "x": 120, "y": 220, "amenities": ["dual-monitor", "charging", "window"] }

{ "id": "R-gerardus", "type": "room", "label": "Gerardus", "seats": 12,
  "x": 460, "y": 40, "width": 280, "height": 120,
  "privileged": true, "allowedRoles": ["manager","csuite","admin"],   // not everyone can book it
  "amenities": ["screen","whiteboard","video-conf","phone"] }
```

- **`amenities` vocabulary:** `monitor`, `dual-monitor`, `charging`, `standing-desk`,
  `window`, `screen`, `whiteboard`, `video-conf`, `phone`.
- **Privileged spaces** carry `privileged:true` + `allowedRoles[]`. The whole
  **Apartment** floor is `restricted:true` + `allowedRoles:["csuite","admin"]` — hide it
  entirely from everyone else.

### The map (Main Floor)
Real office names from the Skedda 3rd-floor plan:
```
 [ Globe ]            [  Gerardus 🔒 ]          [  Atlas  ]
 ── North Wing (Eng) ──  Kitchen | Meridian ──  East Wing (Prod/Design) ──
                         [Booth 1][Booth 2]
 ── West Wing (Fin/HR) ──   Salad lounge   ──  South Wing (Sales/Mktg) ──
```
32 desks (ids `D01`–`D32`, labels `1`–`32`) in four 8-desk wings; 4 rooms (Globe,
Gerardus, Atlas, Meridian), 2 phone booths (pods), the Salad lounge, kitchen.
The **Apartment** is a separate restricted floor with two rooms: `AR1` / `AR2`.

---

## `bookings.json`

```jsonc
{
  "id": "bk-402",
  "spaceId": "D10",                      // → office.json space id
  "spaceType": "desk",
  "date": "2026-06-18",
  "start": "09:00", "end": "17:00", "allDay": true,
  "status": "checked-in",                // confirmed | checked-in | no-show | cancelled
  "bookedBy": "u-15",                    // who created it
  "assignedTo": "u-16",                  // who it's for
  "owners": ["u-15", "u-16"],            // everyone who can manage it (co-ownership)
  "checkInTime": "09:26",                // null until checked in
  "createdAt": "2026-06-16T11:00:00Z",
  "note": "..."                          // optional, demo context only
}
```

### Status lifecycle
`confirmed` → (person arrives) → `checked-in` → fulfilled ✅
`confirmed` → (day ends, no arrival) → `no-show` 👻  (the "ghost booking" problem)
Any owner may move a booking to `cancelled` before it starts.

### Baked-in weekly patterns (drive the "what's busy" view)
| Date | Day | Pattern | Reads as |
|------|-----|---------|----------|
| 2026-06-15 | Mon | 6 scattered bookings, 1 no-show | **Quiet** — mostly remote |
| 2026-06-16 | Tue | 10 Engineering + a few others | **Busy because one team is in** (Eng team day) |
| 2026-06-17 | Wed | ~30 desks, all teams, 2 no-shows | **Peak** — genuinely full, everyone in |
| 2026-06-18 | Thu | 19 mixed; some checked-in, some pending | **Today** — live mix, co-owned bookings |
| 2026-06-19 | Fri | 5 confirmed | **Quiet** — high projected carbon saving |

> Goal-2 demo: pick **Tue** and the breakdown says "Engineering"; pick **Wed** and it
> says "all teams" — same headcount feel, different *reason*.

### Demo hooks already in the data
- **Co-ownership (Goal 1):** Tue `bk-202/203/204` — James (lead) books desks for his team;
  Thu `bk-401–404` — Nina books 4 Product desks and assigns each to a teammate.
  `bk-204` is a **no-show on a co-owned desk** — the co-owner could have released it.
- **Ghost bookings:** `bk-104`, `bk-210`, `bk-306`, `bk-316` end as `no-show`.
- **Privileged room:** `bk-331`, `bk-416` book **Gerardus** (manager+).
- **The Apartment:** `bk-418` (Apartment Room 1), `bk-419` (Apartment Room 2) — only
  visible to C-suite/admin.

---

## `config.json` → carbon

```jsonc
"carbon": {
  "factorsKgPerKm": { "car":0.171, "bus":0.102, "train":0.041, "tube":0.028, "bike":0, "walk":0 },
  "officeDayBaselineKg": 2.4,            // per-head office overhead for an attended day
  "treesPerTonne": 50
}
```
**Saving model:** an attended office day = a round-trip commute
(`2 × distanceKm × factor`). A day someone *doesn't* book = remote = that commute avoided.
Sum avoided commutes → personal, team, and company **CO₂ saved**, convertible to trees.
This is what makes the Carbon Negative story real rather than decorative.
```
```
