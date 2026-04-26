# CSC Archetypes

A standalone web app that drops every CSC player into a CS2 build — like NBA 2K, but for CS2.
Search yourself, see your **archetype**, your **signature stat**, and an **overall skill rating**
computed from the percentile-of-percentile of every meaningful stat.

## What it does

- Pulls live regulation + scrim stats from the CSC public spreadsheet and player metadata from
  the CSC GraphQL API.
- Classifies every player into one of 10 archetypes (Sharpshooter, Spearhead, Phantom, Wall,
  Architect, Wingman, Closer, Hammer, Vanguard, Maverick) based on the percentile of
  role-defining stats inside the currently filtered pool.
- For each player, computes:
  - **Primary archetype** (highest fit) and **secondary archetype** (runner-up if strong enough).
  - **Signature stat** — their highest percentile across a curated stat list.
  - **Overall Skill Rating** — average their percentile across ~47 meaningful stats, then
    re-rank that average against everyone else's average. The result is the player's position
    on the skill curve, not just a flat average.
- Click any player (or use the **search bar** to find yourself) to open a detailed modal with
  the archetype banner, signature stat showcase, fit breakdown, other strengths, and skill
  rating explainer.

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:5173> and search for your in-game name.

```bash
npm run build      # type-check + production bundle
npm run preview    # serve the production build locally
```

## How to find yourself

Type your name in the search bar at the top of the page. Suggestions appear as you type — click
one to open your archetype card, or hit `Enter` to open the top match. If you're not appearing,
lower the **Min N games** filter or switch between **Regulation** and **Scrim** mode.

## Archetypes

| # | Archetype | Role | Tagline |
|---|-----------|------|---------|
| 1 | The Sharpshooter | AWPer / Sniper | One shot, one round won. |
| 2 | The Spearhead | Entry Fragger | First through the door, every round. |
| 3 | The Phantom | Lurker | Found dead. With a knife in your back. |
| 4 | The Wall | CT Anchor | They shall not pass. |
| 5 | The Architect | Utility / Support | Builds rounds, not stats. |
| 6 | The Wingman | Trader / Cleanup | Insurance policy with a Vandal. |
| 7 | The Closer | 1vX Clutch Specialist | Hands ice cold when it matters. |
| 8 | The Hammer | Star Rifler | Numbers on the board. |
| 9 | The Vanguard | Two-Way All-Around | Whatever the round needs, they do. |
| 10 | The Maverick | Eco / Pistol Specialist | Pistol kills, rifle problems. |

## Tech

- React 19 + TypeScript + Vite 8
- TailwindCSS 4 (via `@tailwindcss/vite`)
- `lucide-react` for icons
- `papaparse` for the spreadsheet CSV
- No backend — all stats are fetched client-side.

## Project layout

```
src/
├── App.tsx                       # standalone shell (header, loader, error, footer)
├── main.tsx
├── index.css                     # tailwind theme + glass/gradient/card-glow utilities
├── types.ts                      # PlayerStats / GroupedPlayer types
├── statRanges.ts                 # per-stat thresholds + color helpers
├── fetchData.ts                  # CSV → PlayerStats parser, groups by steamId
├── fetchFranchises.ts            # CSC GraphQL: tiers + player types
├── archetypes.ts                 # 10 archetypes, scoring, percentile helpers,
│                                 # showcase + skill-rating computation
└── components/
    ├── Archetypes.tsx            # main page (search, filters, grid, sections)
    ├── ModeToggle.tsx            # regulation / scrim toggle
    └── PlayerArchetypeModal.tsx  # detailed player card modal
```

## Notes

The CSC GraphQL call is best-effort: if it fails, players just lose their CSC tier / type
badges — archetype assignment still works because it's based purely on the spreadsheet stats.
