# Rewind — homepage

Vite + React + TypeScript build of `project/Home.dc.html` (the cinematic 90s room).

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/ (relative base, host from any path)
```

## Layout

- `src/Home.tsx` — the room: cover-fit stage centred on the TV, hit areas, hover labels, lighting tabs, Liquid light toggle, switch-off navigation.
- `src/Intro.tsx` — camcorder-framed cassette intro (03 · 02 · 01), once per session, skippable (button / Esc / Enter / Space), skipped under reduced motion, 5.1 s failsafe.
- `src/fx.ts` — WebGL water ripple and drag-to-tilt (depth-faked in the ripple shader).
- `src/PosterPopup.tsx` — taped poster + torn paper card.
- `src/Footer.tsx` — live clock and copyright.
- `src/data.ts` — rooms, objects, posters, positions (percent of the 1585×992 room photo).

## Subpages

`public/` holds the TV, Camera, Typewriter and Cassette prototypes unchanged (they load their own runtime from unpkg).
They link back to `Home.dc.html`, which redirects to `./`. Storage keys (`rewind-intro-v2`, `rewind-room`, `rewind-liquid`)
are shared with them, so the Liquid light setting and the once-per-session intro carry across pages.
