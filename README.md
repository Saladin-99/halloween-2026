# Ma3moora Halloween follow-up attempt — 2026

V1 is implemented as a mobile-first React + TypeScript + Three.js invitation. The build is a static website with no backend, tracking, accounts, or uploads.

## Run locally

Use Node.js 22 or later:

```sh
npm ci
npm run dev
```

On Windows PowerShell with scripts disabled, use `npm.cmd` in place of `npm`. Open the local URL printed by Vite. `?view=home` opens the invitation directly without autoplay or downloading the 3D engine.

## Included experience

- Authored, UV-unwrapped lobed pumpkin GLB with curved stem, carved shell, recessed luminous cavity, and lighting. One finger draws, two rotate/tilt and pinch; Alt + drag and accessible rotation controls work on desktop.
- Progressive carve/erase, undo, confirmed reset, brush size, and transparent 1024×1024 PNG export. One entry action is shown at a time. File share is preferred where supported; download and an image link provide fallbacks.
- Versioned local carving/pose persistence, with 24 undo commands and a flattened checkpoint for older strokes. Storage failures leave the experience usable in memory.
- First-entry “Trick or Treat” transition and quick return, browser Back/Forward, and one continuous audio player with a folder-based shuffle playlist, mute and blocked-playback handling.
- Full-square original backyard art, candy falling across the whole screen that can be dragged with mouse or touch, brightly glowing rare gold candy, dog/moon/gate/lights/headphone hotspots, scene signs and a subtle ghost. Pumpkin return and sound controls stay fixed at the bottom left/right.
- Configurable date, Cairo time, countdown, maps, WhatsApp and playlist links; keyboard, reduced-motion and WebGL fallbacks.

All copy, event details, destinations, media paths and interaction tuning live in [src/config/siteContent.ts](src/config/siteContent.ts). The original selected artwork and reference photos remain in `assets/`. Artwork is never cropped to hide or alter the dog's shorter left front leg.

## Build and check

```sh
npm test
npm run test:e2e
npm run build
npm run test:build
npm run preview
```

Browser tests use installed Microsoft Edge on Windows. Set `BROWSER_PATH` to use another Chromium executable. On other systems, run `npx playwright install chromium` once. The browser suite launches its own local server. `BROWSER_PATH` is also supported by `node scripts/inspect-ui.mjs` for optional screenshot inspection while a server is running on port 4173.

Deploy the contents of `dist/` to any static HTTPS host. Relative build and asset paths support hosting in a subdirectory; query-based navigation needs no SPA rewrite. `npm run assets` reproducibly regenerates the pumpkin GLB, transparent candy atlas and fallback illustration, copies supplied venue assets, and retains the Space Grotesk font license. Generated assets are already included in `public/assets/`; asset regeneration leaves your music files alone.

For automatic GitHub Pages deployment, see [docs/GITHUB_PAGES.md](docs/GITHUB_PAGES.md). The included workflow verifies changes on pushes/PRs and deploys successful default-branch builds. Set **Settings → Pages → Source → GitHub Actions** once in the repository.

## Ambient music

Add music files directly to [public/assets/audio/](public/assets/audio/). `siteContent.assets.ambientAudioFolder` points to this folder using `/assets/audio`. Tracks are discovered automatically during development and production builds; no manual track list or directory-listing server is needed. Rebuild/redeploy after changing the folder's contents for the live site.

Each page load creates a fresh random shuffle. Every track plays once per cycle, then the playlist reshuffles and continues. With multiple tracks, the last track of one cycle cannot be the first of the next. Reloading restarts the cycle; returning to the pumpkin and muting do not. An unreadable track is skipped, and an empty folder shows “Music coming soon.” First-time playback waits for a user tap. When music was on, refresh attempts to resume automatically; an intentional mute stays muted. If the browser blocks the restart, playback retries on the next tap/key press or through the sound button.

MP3 is recommended; discovery also accepts M4A, AAC, OGG/OGA, WAV, WEBM, OPUS and FLAC (playback depends on browser/encoding). Nested folders and non-audio files are ignored. Remove `placeholder-ambient.mp3` when adding your own soundtrack if you do not want the demo included. Only that demo track is currently supplied.

## Content still needed for the live party

The specified pending states are intentional:

- Date/time remain **TBD** and the countdown says “Date dropping soon.” Enter a confirmed ISO instant with `Z` or the correct event-day UTC offset.
- WhatsApp is disabled until a real `https://chat.whatsapp.com/...` group invite is configured.
- The current Google Maps link is clearly marked as an approximate area map. Replace it with a verified gate destination.
- The playlist dialog remains pending until a real collaborative invite and `collaboration-invite` status are configured.
- Add your custom soundtrack files to the ambient audio folder when ready.

Browser checks passed in desktop Edge, including emulated mobile sizes and real browser touch events. Physical iPhone Safari/Android behavior, device performance and native iOS share/save should still be checked before public launch. See [docs/V1_IMPLEMENTATION.md](docs/V1_IMPLEMENTATION.md) for verification and architecture details.

The original [developer specification](DEVELOPER_SPEC.md) and numbered `docs/` files are preserved as the handoff requirements. Their statements that implementation or generated assets are missing describe the initial package; this README and the implementation record describe the delivered v1.
