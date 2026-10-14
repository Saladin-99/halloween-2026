# 04 — Recommended implementation architecture

## Stack / deployment
- **Vite + React + TypeScript**, statically built/deployed to GitHub Pages, Cloudflare Pages or Netlify (no backend needed).
- `three` + `@react-three/fiber` for pumpkin only; built-in Three.js `Raycaster` for UV paint mapping; a GLB model sourced/created offline.
- Lightweight CSS animations or **GSAP** (optional) for choreographed Trick or Treat transition / venue reveal. Prefer CSS for candy drift/pop; no heavy physics engine.
- One top-level AudioController HTMLAudioElement; optionally Web Audio GainNode for fade; no Spotify API integration required.
- CSS modules / vanilla CSS; styling tokens in one stylesheet. Avoid loading UI libraries just for a handful of buttons.
- Host via HTTPS; set caching for hashed bundles, immutable generated scene images and audio; static SPA route fallback only if path-based routing is used.

## Directory proposal
```
site/
  public/
    assets/
      backyard-scene-480.webp
      backyard-scene-800.webp
      backyard-scene-1254.webp
      pumpkin-carvable.glb        # pending production artwork
      candy-atlas.webp           # pending production artwork
      audio/placeholder-ambient.mp3
  src/
    config/siteContent.ts        # single home for all text, event dates, links, media refs, tuning
    app/App.tsx
    state/siteMachine.ts
    components/PumpkinStage.tsx
    components/PumpkinCanvas.tsx
    components/CarvingControls.tsx
    components/TransitionOverlay.tsx
    components/InvitationHome.tsx
    components/VenueScene.tsx
    components/SceneHotspot.tsx
    components/CandyRain.tsx
    components/EventDetails.tsx
    components/Countdown.tsx
    components/RSVPButton.tsx
    components/AudioController.tsx
    hooks/useGestureCarving.ts
    hooks/usePumpkinPersistence.ts
    hooks/useAudioPlayer.ts
    styles/tokens.css
    styles/global.css
```

## Routing/state
Simple state machine is enough; no full router required for a two-view experience.
```
view: 'pumpkin' | 'transition' | 'home'
firstHomeEntered: boolean // session state
pumpkinEverTouched: boolean // drives progressive controls
activeTool: 'carve' | 'erase'
activeGesture: 'idle' | 'drawing' | 'rotating' | 'wait-release'
strokes: Stroke[]
pumpkinRotation: Euler / quaternion
sceneLighting: 'default' | 'moonlit'
muted: boolean
musicStatus: 'idle' | 'playing' | 'muted' | 'blocked'
```
Back and forward browser navigation: prefer query params `?view=home` / `?view=pumpkin` with `history.pushState` and `popstate` handling; default first visit with no query is pumpkin. Direct `?view=home` should work as a public shortcut. Browser Back should never discard a saved drawing. For a pure static deployment, query routing avoids server rewrite concerns.

## Persistence / privacy
- `localStorage`: strokes and pose, optional mute preference; key namespace `ma3moora-halloween:v1:*`.
- `sessionStorage`: first-home visited only if you want to avoid rerunning first transition in a tab refresh. Recommended: reset visit on fresh tab but preserve drawing across days.
- No analytics, cookies, sign-in, IP collection or RSVP backend required. External WhatsApp/Spotify/Google maps follow their own privacy terms.
- If persistence fails, continue in-memory gracefully.

## Audio timing — critical
1. Instantiate single `<audio loop preload="auto">` once at app root; load placeholder source via config. Initially paused.
2. On **direct user tap** of Enter/Go to home that causes *first home visit*, call `audio.play()` **synchronously in event handler** with volume at/near zero; catch promise rejection. Do not await `setTimeout` and then request play.
3. Begin transition; once home visible, tween to `ambientVolume` over ~1s. A successful `play()` with near-zero volume can be faded; if blocked, show a visible “Tap to play music” icon.
4. On revisits, keep same audio object/position, no reload or new loop.
5. On mute, set volume to zero or set muted; remember state. Unmuting may itself be a user gesture, so retry rejected play then.
6. On tab hidden, browser may suspend playback; update UI when media events fire. Do not promise continuous audio when OS/browser interrupts it.

## Dynamic config rules
**ALL USER-VISIBLE TEXT**, copy, tooltips, CTA labels, messages, alt text, event info, URLs, and asset paths must be read from `src/config/siteContent.ts` (included). No scattered hardcoded strings. The stylesheet can hold non-content technical constants (colors and dimensions), but interactive timing and all event details are editable through config.

Null behavior is **specified**, not assumed:
- Missing `partyStartsAtIso` = show placeholders + countdown pending.
- Empty WhatsApp URL = disable CTA gracefully.
- Placeholder Spotify link = open Spotify home but visually mark as pending collaboration invite in accessible hint, or disable collaboration action and show note. **Never claim users can add tracks using the placeholder**.
- Approximate Maps search link = works as an area-search demo but has not verified either named gate; update before public launch.
- Missing glb/atlas = development fallback only; production release gate fails.

## Performance targets (proposed acceptance budgets)
- Fast perceived interaction: first meaningful text and static backdrop within ~2.5s on mid-tier mobile / reasonable 4G; pumpkin 3D streams in without blocking “Skip”/“Enter”.
- JS total compressed target ~<500 KB initial where feasible with 3D lazy-load, not a hard guarantee before implementation.
- Image: scene 480w ~53KB, 800w ~134KB, 1254w ~299KB in included examples; pick via responsive `srcset` and cache.
- Pumpkin model compressed <1.5–2MB ideally, textures optimized; animated effects no major jank. 30fps minimum mid-tier, target 60fps on modern devices. Cap DPR and shader complexity.
- Candy DOM sprite count ≤14 on mobile and spawn slowly; disable expensive filters under low-power/reduced-motion.
- No large layout shifts; reserve image aspect ratio. Keep interactive hit areas ≥44 CSS px.

## Responsive and accessible
- Design baseline **390×844** portrait, verify 320×568, 360×800, 430×932; scale responsively to tablet and desktop rather than making a separate desktop product.
- Safe area insets for notches/home-indicator. Reduced motion, contrast, focus rings, keyboard actions, screen reader scene description and alternative path past canvas.
- Ensure gestures don't hijack browser scrolling outside canvas. Audio always user-mutable. Rare-candy secrets are decorative; all practical information accessible via regular HTML.
