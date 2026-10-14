# Developer-ready specification — Ma3moora Halloween follow-up attempt (2026)

**Version:** 1.0 — 2026-10-14  
**Product:** static-hostable mobile-first interactive Halloween party invitation.  
**Chosen art:** `assets/backyard-selected-master.png` — first of the final two corrected illustrations.  
**Primary edit point:** `src/config/siteContent.ts` — all visible text, event details, external links, asset paths and tuning values.  
**Readiness:** build specification and assets supplied; website itself, 3D pumpkin and candy sprites are yet to be built.

> **Scope status:** User decisions are locked. Pending real event date/time, WhatsApp invite, accurate Google Maps gate, Spotify collaboration invite and custom background track. No fake values substituted for live invitation links.

## Executive scope at a glance

**Intro:** giant movable/tiltable 3D pumpkin, finger-carving with visual cut-outs; one finger draws, two rotate/tilt, pinch optional. First carve reveals edit tools, Enter, Save and Go to home; carve as long as desired. Transition uses animated “Trick or Treat”. **Home:** full selected illuminated backyard illustration with dog (unaltered shorter LEFT front leg), gently falling interactive candies, hidden golden-candy Easter egg, other small scene hotspots, party title, 2026 subtitle, TBD date/time, “See you in” countdown when set, clickable location, WhatsApp CTA “Where do i sign?”, headphones → Spotify collaborator invite and continuing looping soundtrack that begins on first user-initiated home visit. No extra content sections. Mobile priority.

---

---

# 01 — Product definition and mobile user experience

## Goal
Deliver a **static-hostable, mobile-first invitation mini-experience**, not a conventional landing page. Guests can carve a real 3D pumpkin, enter the illustrated Halloween venue, play with falling candies and scene Easter eggs, see practical event details, submit RSVP via a WhatsApp group invite, and contribute to a Spotify playlist.

## Tone
Cool, stylish, playful, warm, slightly mischievous; not cheesy horror, corny skeleton puns, scare jokes, or cluttered party copy. Original artwork is a deep violet moonlit illustration of the actual backyard. The retro-game / “32-bit” influence is a visual accent: precise edges, glowing game-world objects and responsive playful effects; do **not** force a blocky pixel filter over the selected scene.

## Content locked
- Title: **Ma3moora Halloween follow-up attempt**
- Subtitle: **2026**
- Date/time: **TBD**, not guessed. Countdown inactive until a date is set.
- Location (exact text): **Maamoura Beach Main Gate (for cars) or Malahy Gate (for mowaslat)**
- CTA (exact): **Where do i sign?** → WhatsApp GROUP INVITE, when supplied.
- Spotify headphones → “What do you want to listen to?” → collaborative-join URL; Spotify home is an explicit temporary placeholder.
- Opening-to-home title animation: **Trick or Treat**.
- No dress-code/vibe gallery, photo moment, what-to-expect, save-the-date, or “keep carving” action.
- Environment includes small positive green cigarette/smoking sign, drinks/bottle sign, and unobtrusive **BYOB** sign; it communicates vibe visually rather than via another section.

## Journey
```
INITIAL OPEN
  └─ Full-viewport pumpkin carving stage; venue art darkened/blurred behind
      ├─ one finger begins carving → progressively reveal controls and Enter
      ├─ two fingers rotate/tilt, optional pinch zoom → no carving marks
      ├─ Undo / Erase / Start over / Save pumpkin / Go to home
      └─ Enter the party → short Trick or Treat transition + candy burst
         └─ HOME / INVITATION (venue reveal + sound starts on first visit)
             ├─ Falling candy; tappable, rare golden candy
             ├─ Guest-friendly title, date, time, location, countdown
             ├─ Scene: dog, moon, gate, lights, signs, headphones, ghost
             ├─ Where do i sign? → WhatsApp group invite
             └─ Back to pumpkin → saved carving preserved, audio continuous
```

## Entrance stage
- Edge-to-edge experience. At 390 px viewport width, pumpkin art ~330–370 px visually, centered, with room for safe-area spacing and bottom action tray.
- Headline and one-line instruction visible before first interaction. Keep initial controls minimal. Optional accessible “Skip carving and open invitation” link exists for users who cannot manipulate the canvas; it must not visually dominate.
- Controls reveal **on the first carving interaction** (not only after the gesture ends). They remain present thereafter. This is still open-ended carving: no forced end, stroke limit, countdown or “Keep carving” button.
- Dynamic tool tray: Carve/Erase toggle, Undo, Start over, Save pumpkin. **Enter the party** is the dominant CTA, and **Go to home** exists as the quick-return action (when relevant); same destination but initial and return affordances are different context states.
- End-user can sculpt as many strokes as desired and rotate the object using two fingers. The pumpkin is a real 3D mesh, not a 2D image mimicking a model.

## Transition
- First deliberate entry: ~1.45s, adjustable. Words “Trick”, “or”, “Treat” appear sequentially; pumpkin glow flares and candy transitions from burst to downward fall, masking loading if present.
- Do not add an arbitrary extra loading delay when assets are cached or page has already been visited. Reduced-motion: short fade ~200ms without candy camera zoom.
- Returning home from pumpkin after first entry: quick ~300ms transition, not the full ritual again.

## Home layout (portrait)
- Top: small subtitle “2026”; main title may wrap deliberately over 2–3 lines. Supporting line: “You’re invited.”
- A **square responsive scene portal/card** showing the COMPLETE selected backyard artwork, not `cover` cropping that hides the right-side dog. Outer backdrop may extend the scene's colors as blurred gradients. A gentle first-visit reveal removes blur / raises warm lights; no fake second venue image.
- Overlay translucent small hotspots attached to image-space positions; use enough contrast against the rich illustration. Scene interactions are opt-in and never block key information.
- Below/around scene: a compact details cluster (date, time, location link), with an active “See you in” countdown **only when configured**. Prioritize legibility over imitation of headstones or fake signs.
- Obvious WhatsApp CTA **Where do i sign?**; make it sticky within reachable thumb space only if it does not obstruct dog, controls or scene. Provide a nonfunctional/disabled-with-explanation state before real invite exists.
- Accessible bottom/floating controls: Back to pumpkin and sound toggle. No permanent 5-item nav bar.
- No unnecessary extra sections.

## Sound
- Never play ambient audio during initial carving.
- During the tapped **Enter the party** action, call `audio.play()` synchronously as part of the gesture; start silent/near-silent and fade to configured volume as home renders. Do not delay the initial play call to an animation timeout, which may lose browser gesture authorization.
- Audio instance lives at application root and continues across pumpkin ↔ home navigation without restarting.
- Visible sound/mute control at all times after first entry; manual mute state overrides navigation. If autoplay is blocked, display an explicit tap-to-play state without claiming audio is playing.
- Direct home route without a preceding user interaction must respect autoplay restrictions; start muted/off and wait for tap.

## Countdown
- `partyStartsAtIso = null`: do not invent a date. Show “Date dropping soon” under “See you in”; do not render zero days/hours.
- Valid timestamp: compute target-date difference from real client wall-clock time with a fixed zone-safe instant and refresh every second; when in past, show configured completed text, no negatives.
- `Africa/Cairo` is used for formatting. Event timestamp must include its **correct local UTC offset** at the actual party date; use a timezone-aware date library at content-entry time or enter the verified UTC instant.

## External journeys
- WhatsApp group: new tab to a VALID `https://chat.whatsapp.com/...` invite, no participant details collected by the website. When blank, CTA is disabled and tells visitors the invite is coming.
- Location: whole location label is clickable to Google Maps. The included `Maamoura Beach, Alexandria` search URL is **only an approximate placeholder**; verify gate pin and update single config prior to launch.
- Spotify: headphone prop prompts and opens the configured URL in new tab. Current URL `https://open.spotify.com` is not a collaborative invitation. Replace with Spotify-generated “Invite collaborators” URL, ideally with follow-up after link expiry.

---

# 02 — Carvable 3D pumpkin: technical implementation

## Production choice
**React Three Fiber (R3F) / Three.js, physically modeled pumpkin glTF/GLB, UV-space brush mask, shader cutout and lit interior.** A plain orange sphere with strokes is explicitly unacceptable. This is a visual carve: mask-controlled openings on a modeled outer shell, dark/orange interior shell behind them and a luminous material at the cut. It is not an expensive live Boolean remesh.

## Asset requirements (NOT included yet)
- `pumpkin-carvable.glb`: distinct lobes/ridges, stem, slight asymmetry, normal detail, UV-unwrapped watertight-ish carve surface, no front visible UV seam, correct tangents/normals; exterior shell and inner shell or cavity; a moderately dense but mobile-friendly mesh.
- Keep the face region broad and readable; largest silhouette ~85–95% available stage width; allow rotation of full pumpkin ±full yaw and tilt up/down ±60°.
- UVs must cover all exterior angles so a user can carve the back. Evaluate poles and seam cases on real model, and ensure raycast results correspond to rendered object.
- Developer may prototype the algorithm on a custom sphere but must replace with a proper pumpkin model for final acceptance.

## Brush/mask pipeline
1. Pointer gesture manager calculates normalized device coordinates relative to WebGL canvas.
2. `THREE.Raycaster` intersects **only the pumpkin's outer carved shell** and reads `intersection.uv` when valid. If ray misses, do not draw outside the pumpkin; keep stroke transaction open until pointer leaves/releases.
3. Map UV → CanvasTexture mask pixel (`x=u*W`, `y=(1-v)*H`, adjusted for texture orientation and model-specific UV transform). Mask is `1024²` by default; optionally `2048²` on capable devices after testing.
4. On pointer move, interpolate evenly spaced brush dabs between last and current UV so fast swipes do not become a dotted line. Recommended spacing ≤1/3 brush radius; smooth with a short moving filter without delayed “rubber-band” feel.
5. Carve sets alpha/opacity cut mask; Erase removes mask values. **Commit** a stroke on pointerup/cancel/gesture promotion; Undo removes last committed stroke. Preferred undo data model: commands/stroke vectors + replay buffer, not 24 full 1024² ImageData snapshots.
6. Shader outer-shell alpha discards carved pixels or otherwise reveals inset cavity; add a narrow ragged chamfer/edge illumination based on blurred or distance-transformed mask, dark recession, and warm glow from beneath. Eye catching but not white marker lines.
7. Preserve mask in GPU texture for display; keep source stroke commands for reproducible undo and persistence. Anti-alias edge and pre-multiply appropriate alpha.
8. Wrap UV seam on interpolated strokes by picking the shortest wrapped U distance, splitting draw at seam when necessary. Never connect one side of globe to opposite side with a line across texture. Test extreme angles.
9. Avoid random geometry deformation at each brush move; mobile performance is the priority.

## Pointer / multi-touch state machine
```
IDLE
  1 pointerDown on pumpkin -> DRAWING (stroke begins)
  1 pointerDown outside pumpkin -> IDLE (no stroke)
DRAWING
  pointerMove -> mask brush samples
  second pointerDown -> commit/close stroke; ROTATING [no draw]
  pointerUp/cancel -> commit stroke; IDLE
ROTATING
  2 pointers moving -> yaw/pitch, optionally pinch zoom
  1 of 2 pointersUp -> IDLE or WAIT_RELEASE, NEVER automatic carve
  both pointersUp/cancel -> IDLE
WAIT_RELEASE
  remaining finger gesture ignored until release and fresh pointerDown
```

### Gesture implementation notes
- On the **3D canvas only**, apply `touch-action: none`; leave regular homepage/browser scrolling intact outside stage.
- Use DOM `PointerEvent`s and a `Map<pointerId, {x,y,...}>` on the stage wrapper as the authoritative touch manager. R3F mesh events may supply raycasts, but **do not rely on R3F multi-pointer capture**: its documented capture implementation has limitations for multiple pointers. Raycast manually for the active draw pointer.
- Prioritize **two-finger gesture** immediately; prevent two simultaneous strokes. If second finger is added, cease painting even if first finger continues moving.
- Rotation = centroid movement for yaw/pitch, optional two-pointer distance for constrained zoom (0.85–1.4x). No unexpected auto rotation once user is interacting. Preserve tilt and yaw on revisiting.
- Mouse alternative: click-drag draws; hold `Alt`+drag rotates (or dedicated small rotate tool for desktop); scroll wheel zoom if implemented. Keyboard accessible alternative for rotation via arrow buttons or accessible rotate mode; a skip link to home works without canvas.
- Use device pixel ratio capped (e.g. 1.5–2) and limit mask updates via `requestAnimationFrame` batching instead of React re-rendering each pointer event.

## Controls and behaviors
| Control | Behavior |
|---|---|
| Carve / Erase | Tool toggle; selected state visible; Erase only affects existing carve pixels. |
| Undo | Replays without last committed stroke; disabled if none. |
| Start over | Confirm, then clear all strokes. The model's rotation can remain where it is. |
| Save pumpkin | Render **the current 3D view** to a square transparent PNG (e.g. 1024²), without UI text; include cutout glow. Mobile: Web Share API file share where supported; otherwise download or open generated image for long-press save. |
| Enter the party | First entry: transition to home and start audio on user tap. Not dependent on carving completion. |
| Go to home | Same destination; on first-ever entry performs normal first-visit behavior, otherwise quick return. |
| Back to pumpkin (home) | Restore strokes and model angle exactly as left, without audio restart. |

## Storage and export
- Store strokes (tool, radius, uv polyline, timestamp), rotation quaternion/euler and optional brush width in localStorage as JSON version 1. Persist after stroke commit and when exiting; wrap storage reads/writes in try/catch.
- Cap undo stack to ~24 commands while retaining full finalized state. If unlimited total strokes, compact older commands into a flattened mask checkpoint; undo affects newest 24 (configurable).
- Use either an offscreen render pass and readback or render the pumpkin into a separate transparent viewport for export; avoid permanently enabling expensive `preserveDrawingBuffer` unless necessary. Test Safari share/download fallback.
- No cloud upload, account, or collecting guest drawings. Clearing site data loses local work.

## Fallbacks / QA
- If WebGL unsupported, show a static elegant pumpkin image/illustration and direct “Enter the party”; never block RSVP.
- Reduced-motion users can still carve; suppress unnecessary sparks, excessive camera sway, and long transitions.
- Test three-pointer edge cases, finger leaving viewport, pointercancel, rapid switching 1→2→1, rotate on rear, erase over seam, undo after erase and save PNG on iOS Safari.
- Performance target: rotate/carve 30fps minimum on representative 3-year-old mid-tier mobile, preferably 60fps; no massive texture allocations during stroke.

## Reference documentation
- Three.js Raycaster `intersection.uv`: https://threejs.org/docs/pages/Raycaster.html
- R3F pointer/capture note: https://r3f.docs.pmnd.rs/api/events
- Pointer events: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Using_Pointer_Events
- touch-action: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action

---

# 03 — Invitation scene, candy behavior and Easter eggs

## Selected artwork: locked
`assets/backyard-selected-master.png` is the **first corrected image** from the two revised alternatives. It matches the wider balcony view. The dog's anatomical left foreleg is intentionally thinner and shorter, ending above the ground. **Do not regenerate or “repair” that detail**. The dog is featured happily wearing a purple witch/bat-wing costume.

Composition: square; balcony railing across bottom; glowing pumpkins lower corners; broad tree/palms left and central tree; orange bulbs across upper third; moon upper right; backyard gate at mid-right; small dog in lower right. Warm amber/purple scene contains most desired Halloween atmosphere already. Treat it as an authored illustration, NOT a 3D model.

## Venue reveal
- Before home: same backdrop is significantly darkened and soft-blurred behind the big 3D pumpkin.
- `Trick or Treat`: pumpkin fills with light; candy bursts outward; transition dark stage to visible backyard.
- On first home paint: image sharpens and lights settle with a subtle, non-distracting 2.5D reveal. Could animate a soft vignette, light glow and gentle zoom ~1.015→1.0; do **not** fake 3D camera travel through this single square image.
- Scene square must remain intact in phone portrait, scaling down rather than vertically cropping. The image should be used via `<picture>` responsive `srcset` at 480/800/1254 widths, frame `aspect-ratio:1` and `object-fit:contain` or intrinsic square fit. The surrounding section background can be filled by matching dark-violet gradients or an enlarged blurred derivative (decorative only).
- HTML hotspots position with percentages **relative to the square image container**, not the full viewport. On small screens, fade or relocate overlapping UI badges; minimum interactive hit areas remain 44x44 CSS px.

## Required environmental props
These may overlay or be lightly composited near rail/grass as small stylized illustrations; reference-only hotspots are okay in initial implementation. Avoid a separate scroll section for them.
- **Green smoking-allowed icon**: the visual opposite of a no-smoking sign — bright green circular sign, cigarette glyph, no red strike-through. Label/title from config. Do not make it the dominant graphic.
- **Drinks allowed**: bottle or two glasses on a similar environmental sign.
- **BYOB**: a little placard on railing, cooler, table or fence; restrained typography.
- **Headphones**: object near a plausible garden/porch position. Tap → “What do you want to listen to?” small overlay → “Add to the playlist” external link.
- **Dog**: leave body and face unobscured and keep her left front limb accurate; invisible/barely visible hotspot can add a warm glow, tiny animated paw-print trail or small message (“The real host.”) when tapped. Do not try to independently wag its tail unless a faithful isolated cutout/animation is later supplied.

## Candy system — mandatory
- Independent of the venue image: overlay a limited set of visually delicious **glossy 2D transparent candy sprites** (not emoji) in a separate composited rendering layer.
- At 390×844, ~8–14 concurrent candies; speed 8–16 seconds to cross viewport vertically, with slight horizontal drift and gentle rotation. Spawn time staggered, variety of wrappers/colors/sizes; offscreen recycling. Some float slightly rather than fall perfectly straight.
- Candy must avoid obscuring primary title, map link, WhatsApp CTA or sound control: spawn in edge-weighted lanes, and render hero CTA layers above visual candy. Interactivity may overlay transparent regions but never intercept RSVP taps.
- Tap a candy → squish, pop, sparkle/glint and disappear / respawn later. Short spring effect; no negative reaction to a missed tap. Respect reduced-motion and low-end settings.
- Rare golden candy: small chance per spawn (`0.025` starting tune), max 1 concurrent. A tap reveals one of configured short secret messages in a small dismissible tooltip. Keep it discoverable but never essential to event details.
- Use GPU-friendly CSS transform sprites or batched 2D canvas; **not** one WebGL renderer per candy. Keep pointer hitboxes aligned with moving visual. Use seeded randomness optionally for reproducible test automation.

## Extra Easter eggs (subtle, all non-blocking)
| Object | User action | Reaction | Requirement |
|---|---|---|---|
| Moon | Tap | Background moonlight shifts slightly cooler/violet, tap again resets; no page-wide harsh strobe | P1 |
| Dog | Tap | Tiny sparkle / pawprint + “The real host.” message | P1 |
| Gate | Tap | Halo pulse and small panel showing location + Maps action (“See where it happens”) | P1 |
| String lights | Tap | Bulbs change among 2–3 tasteful palettes, preserve legible scene | P2 |
| Ghost | Rare slow drift → tap | Floats off / gentle puff; may reveal a one-line note | P2 |
| Rare candy | Catch/tap | Short surprise from constants | P0 |
| Carved pumpkin | Return from home | Same carving/rotation retained; optional warm glow response | P0 |

P0 = launch-critical; P1 = should ship; P2 = can land in follow-up polish if time requires. **Candy interaction and rare candy are launch-critical.** It is fine to omit a complex fortune-telling crystal ball or haunted door; the existing gate is a more natural interactive object.

## Spotify caveat
Only **collaborative playlist invite** grants guests add-track permissions. `https://open.spotify.com` is a test placeholder and does not grant those permissions. Spotify documentation reports that generated collaboration invite links expire after **7 days**; replacing static config and redeploying is necessary when a link expires. No dynamic refresh is possible on a purely static site without backend/owner action.

## Sound effects
The included ambient placeholder is a custom generic original synthesized loop for development, **not a cleared commercial song**. Production custom track replaces this in `siteContent.assets.ambientAudio`. Candy pops / bark / ghost noises are optional; default to subtle visual effects and do not clutter with stacked loud sounds. Do not play effects when audio is muted.

## Image-space anchor starting points
Coordinates are approximate normalized fractions for the square source, and all live in `siteContent.tuning.sceneHotspots`:
- Dog `(0.74, 0.66)`; Moon `(0.84, 0.12)`; Gate `(0.84, 0.54)`
- Lights `(0.37, 0.39)`; Headphones `(0.14, 0.62)`
- Smoking, drinks, BYOB signs are **not currently drawn into the selected art**. Place independent transparent overlay sprites at suitably open areas, iterating from starting percentages in config.
- Inspect at 320–430px and adjust anchors to avoid text collision. Never obscure the dog's face or make her leg look different from the selected version.

---

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

---

# 05 — Design tokens, supplied assets and remaining production assets

## Selected venue art
- Canonical: `assets/backyard-selected-master.png` (1254×1254). **Chosen first of the two final corrected renderings**.
- Responsive derivatives: `backyard-scene-{480,800,1254}.webp` — same image, no creative alterations or aggressive crop.
- Three original user photos in `assets/references/` to guide modeling and placement. Primary wide perspective: balcony / wooden rail looking onto lawn.
- Usage priority: full-square interactive scene on the invitation homepage; heavily dimmed/soft-blurred decorative version behind 3D pumpkin entry screen.
- Maintain dog anatomy as supplied: anatomical left front leg is shorter/thinner and does not reach the ground. The dog should remain recognizable and costume subtle/fun (witch/bat).

## Suggested scene design system
| Design token | Value | Usage |
|---|---|---|
| background-deep | `#17112C` | Main page background |
| background-secondary | `#2A1A48` | Raised surfaces, vignettes |
| pumpkin | `#F68A27` | Buttons, hero flame, candy |
| amber-soft | `#FFC268` | Lantern highlights |
| violet | `#A558D4` | Magical accent |
| lime | `#B4EF63` | Selective signs / micro-interactions |
| candy-pink | `#FF5E8D` | Sprites only |
| text | `#FFF2DE` | Headlines and body |
| muted | `#D2C2E6` | Secondary info |

- Title: chunky, confident modern display font (e.g. Bricolage Grotesque or Space Grotesk Bold). Tiny decorative retro/game glyphs may use Silkscreen but **never** lengthy event details or map label in tiny pixel type.
- Cards: slightly frosted deep-violet glass / soft dark gradients with subtle warm rim lights; avoid oversized neon outlines and cheap horror fonts.
- Copy: no corny jump-scare lines, no “dress to kill,” no forced second sections. Use exact title and CTA strings from config.
- Motion: candy falling at mixed reasonable speeds, drifting; parallax tiny and bounded; visual complexity must not hurt the information hierarchy.

## Pending art / audio / links (do not mislabel as included)
1. **3D pumpkin GLB** — real custom model plus UVs and cavity. Cannot derive this from square image alone.
2. **Candy transparent sprite atlas** — at least 8 vivid, appetizing wrapped/soft candy shapes, high-resolution transparent RGBA, no text. May include rare metallic golden candy separately.
3. **Environmental sign overlays** — green permitted-smoking icon, allowed-drinks/bottle icon, BYOB small sign, headphones. Can be SVG drawn in code, but designer should finesse their appearance.
4. **Optional floating ghost sprite** / sparkle / pop effects; do not require them for critical experience.
5. **Real date/time**, map pin for intended car/public-transport gate, WhatsApp group invitation, actual **Spotify collaboration** invitation (expires after 7 days per Spotify support), custom soundtrack.
6. Optional tiny SFX candy-pop/whoosh; not supplied and not required.

## Included development audio placeholder
`assets/audio/placeholder-ambient.mp3` is a short looping synthesized atmospheric demo made for this package. It is functional background sound, not a substitute for your custom track. Use the single configuration key to replace it.

## Render/layout measurements
- Base phone width 390px, hero art frame target ~calc(100vw - 24px) with 1:1 aspect ratio. At 390px this is ~366px high, still leaving space for title and essential CTA within reasonable scrolling.
- On very short screens, allow body scroll; do not shrink text to fit everything above fold.
- Intro pumpkin stage fills device viewport; 3D mesh larger (~86–95% stage width) and controls can overlay translucent bottom gradient, with safe areas.
- Scene hotspots position at fractions of the rendered 1:1 art, not `vh` / screen pixel offsets. Their visible icons may move to nearby badges if collisions occur.

## Image usage examples
```html
<picture>
  <source
    srcset="/assets/backyard-scene-480.webp 480w,
            /assets/backyard-scene-800.webp 800w,
            /assets/backyard-scene-1254.webp 1254w"
    sizes="(max-width: 640px) calc(100vw - 24px), 620px"
    type="image/webp" />
  <img src="/assets/backyard-scene-800.webp"
       width="1254" height="1254"
       alt="...from siteContent.copy.general.imageAlt"
       style="width:100%;height:auto;aspect-ratio:1;object-fit:contain" />
</picture>
```

Do not mix WebGL raycast coordinates with scene hotspot art coordinates. The pumpkin object is a separate renderer; backyard artwork is a static image plus positioned HTML interaction overlays.

---

# 06 — Acceptance criteria, testing and release gates

## Priority legend
- **P0 / must ship**: cannot launch without it.
- **P1 / expected**: expected to ship, cut only by explicit product decision.
- **P2 / polish**: ship if budget/time allows, without delaying P0.

## Functional acceptance (test-case IDs)
| ID | Priority | Given / When / Then |
|---|---|---|
| ENT-01 | P0 | New visit shows full-screen carveable 3D pumpkin with exact one-finger/two-finger hint; no audio. |
| ENT-02 | P0 | First one-finger stroke creates a visually cut/gouged luminous opening on pumpkin (not just a painted orange line) and reveals toolbar/Enter. |
| ENT-03 | P0 | Multiple single-finger strokes remain possible indefinitely; no forced navigation after lift. |
| ENT-04 | P0 | Add second finger mid-stroke: carve stroke commits, movement rotates/tilts only, no new paint. |
| ENT-05 | P0 | After two-finger gesture ends with one finger remaining, no accidental new carve until fresh pointerdown. |
| ENT-06 | P0 | Rotating pumpkin to rear face allows carving where model UVs exist; seam does not create phantom line. |
| ENT-07 | P0 | Undo, Erase, Start over work and respect undo history; UI disabled states correct. |
| ENT-08 | P0 | Save pumpkin exports/rendered PNG with current carve + rotation, transparent background, without controls. iOS fallback documented. |
| ENT-09 | P0 | Home → Back to pumpkin shows existing strokes and orientation, not blank; home navigation returns correctly. |
| HOM-01 | P0 | First home entry animates “Trick or Treat”, candy moves into ongoing rain, exact event title + `2026` visible. |
| HOM-02 | P0 | Sound begins on first home visit **after user-tapped entry** (not during initial carving) and can be muted. Blocked autoplay correctly shows tap-to-play. |
| HOM-03 | P0 | Home ↔ pumpkin navigation preserves continuous audio instance/playback time and manual mute preference. |
| HOM-04 | P0 | Square backyard art completely visible at 320/360/390/430px; costumed dog and shorter/thinner LEFT FRONT LEG not cropped or “corrected.” |
| HOM-05 | P0 | Glossy candy falls gently, tap produces satisfying reaction; rare gold candy appears occasionally, reveals small configured secret. |
| HOM-06 | P0 | Date/time both show TBD, countdown has pending state rather than made-up values or negative timers. |
| HOM-07 | P0 | Entered valid future party timestamp displays real `days/hours/min/sec` countdown correctly across timezone change, returns complete state at zero. |
| HOM-08 | P0 | Whole exact location label opens configured Google Maps destination, and configured placeholder is clearly documented as approximate. |
| HOM-09 | P0 | “Where do i sign?” uses configured WhatsApp GROUP invite; before configured, it must not open a fake invite URL. |
| HOM-10 | P0 | Headphone prompt opens configured Spotify link; placeholder cannot be described as a functional collaboration invitation. |
| HOM-11 | P0 | There are no separate dresscode/vibe, photo, what-to-expect, or save-the-date sections. |
| HOM-12 | P1 | Green permitted-smoking sign, drink-allowed sign, and BYOB placard integrated into scene. |
| EGG-01 | P1 | Tap dog hotspot shows gentle response, not obstructing image/dog/CTA. |
| EGG-02 | P1 | Tap moon toggles tasteful lighting without seizure-inducing flashes. |
| EGG-03 | P1 | Tap gate shows location panel with Maps action. |
| EGG-04 | P2 | Tap string lights changes palettes; occasional tappable ghost. |
| SYS-01 | P0 | ALL visible copy and links read from `src/config/siteContent.ts`; no strings scattered through components. |
| SYS-02 | P0 | When WebGL unavailable, site still provides fully usable invite and links. |
| SYS-03 | P0 | Focusable controls, keyboard invite path, 44px targets, no severe contrast or motion accessibility blockers. |
| SYS-04 | P0 | Static hosting build works over HTTPS without a backend; refresh or direct `?view=home` works. |

## Manual device matrix
- iPhone Safari: modern iOS, 390-ish width; iPhone SE-size width if available.
- Android Chrome: midrange phone, 360/393/430 widths; verify two-finger gesture handling.
- Desktop Chrome/Firefox/Safari/Edge: keyboard, mouse alternative and responsive fallback.
- Landscape phone, reduced-motion, low-battery / CPU-throttled mobile Chrome, poor network, save/download restrictions.

## Performance regression checks
- No long frames while pointer strokes update; masked shader doesn't allocate textures per event.
- No pointercancel when two fingers interact with pumpkin canvas; normal scroll stays available on home page.
- No critical UI hidden by falling candy. No 3D pump background drawn over invite controls.
- Pause or reduce candy when document hidden; no runaway timers or duplicated audio after view transitions.
- Compare screenshot with selected master on iPhone: same visible dog, moon, railing and gate; art not cropped to 9:16.

## Pre-launch content checklist (blocking if real public invite)
- [ ] Real party date/time entered, checked in `Africa/Cairo` including date-specific UTC offset.
- [ ] Exact Google Maps gate destination verified (NOT current generic Maamoura Beach search).
- [ ] Real valid WhatsApp group join URL configured.
- [ ] Spotify collaborator invite verified and age/expiry considered; current Spotify homepage is demo-only.
- [ ] Custom music replaced if desired, source/license owned and volume checked.
- [ ] Real pumpkin GLB created, UV/seam/rear-carving tested.
- [ ] Real candy atlas created, with rare gold candy and optimized transparency.
- [ ] Scene signs completed and dog leg preserved exactly as selected.
- [ ] Test iOS gesture/audio/save flow with a physical device.
- [ ] External links `target=_blank` use `rel=noopener noreferrer`, URL protocol validated.

---

# 07 — Implementation roadmap and engineering handoff

## Order of implementation
**Phase 0 — Infrastructure & scene framing**
- Create Vite React TS app, styles/tokens, single content config import, central view state, direct-home query handling.
- Ship responsive homepage with supplied WebP image, exact title, event TBD placeholders, contact CTA disabled state, location link, Spotify placeholder hint and scene sound control.
- Make scene square and visible fully on real phones, then adjust hot-spot anchors; verify dog remains visible.
- Exit: static build/preview works; no missing copy constants; smoke/drinks/BYOB overlaid roughly.

**Phase 1 — Real 3D carving milestone**
- Obtain/create UV-unwrapped GLB pumpkin; show with scene background blurred/dimmed.
- Implement one-pointer UV brush mask with shader carve depth and interior, then Erase, Undo, Reset and history. Test back and seam.
- Implement two-finger rotate/tilt, pinch optional and gesture demotion rules. Persist strokes/pose; export PNG.
- Exit: 10 successive strokes, arbitrary rotation, undo and save work on Android and iOS.

**Phase 2 — Transitions & home soundtrack**
- First-entry Trick or Treat animation and first home reveal, no duplicate transitions on navigation.
- Single audio instance with first-home click unlock, fade-in, mute, rejection fallback, background tab behavior.
- Countdown TBD state and configured live timer.
- Exit: home transition ~1.45s, audible loop on allowed devices only after entering, mute works, return does not restart.

**Phase 3 — Candy & environmental play**
- Deliver candy atlas; implement down-fall, drift, different designs, tap interaction, rare gold candy + message.
- Add dog, moon, gate interactions + environmental sign sprites + headphones/Spotify prompt. Make sure tap regions are accessible and scene legible.
- Exit: all P0/P1 tests pass and no candy covering CTA.

**Phase 4 — Polish & release**
- Test on small iPhone and midrange Android; refine layout, frame budgets, contrast, keyboard shortcuts and prefers-reduced-motion.
- Plug in real date/time, gate map, WhatsApp, real collaborative playlist and custom track; double-check link access and expiry.
- Build and deploy statically; verify on production HTTPS URL and send to a friend for cold-load trial.

## Non-goals
- No backend, email capture, user accounts, analytics, payment, moderation, custom multiplayer pumpkin gallery, playlist server integration, or automatically maintained Spotify collaboration invites.
- No deep real-time VR / navigable 3D backyard from single 2D image. The venue is a curated 2.5D image scene with HTML hotspots.
- No extra “what to expect,” dress code, photo moment, date card, or forced storytelling jokes.

## Handoff boundaries
**This ZIP is a specification + actual venue assets + editable config + development audio placeholder. It is not an implemented website.** Missing production art is explicitly marked. A developer should not interpret any provided screenshot or composition as already having 3D, carving, responsive hotspot tracking, audio or candy code. Quality bar is set by P0 acceptance, not by static mockups.

## Useful design decisions
- **Keep selected art square:** full image = preserve dog, moon and rail. Tall full-bleed crop is expressly rejected; gradients fill portrait excess.
- **True 3D pumpkin vs 2D art:** proper GLB and shader carve mask are required; source image only supports venue look.
- **Audio permission:** first home visit is triggered by user tap; unlock inside that click event. No autoplay on first open.
- **Spotify collaborator invitations expire:** replace static link when necessary; owners manage playlist membership offsite.
- **No extra navigation:** primary actions are contextual in carving and RSVP/map/audio/carve-return in invite.
- **All copy central:** link and label edits happen in one TypeScript config file.

---

# 08 — Official docs / integration references

## 3D, shader-carving and gestures
- Three.js Raycaster — ray-to-surface intersections and `.uv` for texture brush coordinates: https://threejs.org/docs/pages/Raycaster.html
- React Three Fiber event handlers — mesh events, notes about pointer capture (including multi-pointer limitation): https://r3f.docs.pmnd.rs/api/events
- MDN Pointer Events — tracking touch/pointer IDs: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Using_Pointer_Events
- MDN `touch-action` — enable custom multi-touch on canvas without page-scrolling conflict: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action

## Audio / linking
- MDN Autoplay guide — user-gesture restrictions, blocked play() rejection handling: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- Google Maps URLs — `api=1`, cross-device maps/deep links, proper query or exact Place ID: https://developers.google.com/maps/documentation/urls/get-started
- Spotify Collaborative Playlists — invite collaborators to add tracks; generated invitation links reported valid 7 days: https://support.spotify.com/us/article/collaborative-playlists/

## Notes
- References explain APIs and provider behavior; the architecture/interaction durations in this package are product recommendations, not requirements imposed by those sources.
- URL status and exact event details are editable config values; do not claim a placeholder is a real gate pin, real WhatsApp invite or Spotify collaboration link.

---

## Included edit point

Copy `src/config/siteContent.ts` into your Vite+React project and import it in all visible UI components. This master spec intentionally does not inline hundreds of duplicated strings; the shipped TypeScript file is normative.
