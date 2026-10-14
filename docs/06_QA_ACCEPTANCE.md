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
