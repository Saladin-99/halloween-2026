# V1 implementation and verification

Implemented on 14 October 2026. This document records the delivered implementation; the original handoff specification remains unchanged.

## Architecture

`src/app/App.tsx` owns two-view query navigation and transition timing. The pumpkin stage remains mounted after a guest first opens it so returning preserves in-memory drawing and pose. Direct home visits defer mounting and downloading the 3D engine. Home interactions stay in accessible HTML over the complete original square scene.

`src/pumpkin/Engine.ts` uses Three.js directly, loaded through a React lazy boundary. `public/assets/pumpkin-carvable.glb` is a real authored 3D squash with ten broad lobes, subtle asymmetry, depressed crown, UVs covering every exterior angle, smooth seam normals, a separate recessed interior and a curled stem. `scripts/generate-assets.mjs` is its reproducible source. The default model is about 1.11 MiB, with no runtime Boolean remeshing or external model download.

`Mask.ts` uses a 1024² CanvasTexture and interpolated elliptical dabs. The outer material discards carved pixels; a dark rim and inset luminous interior reveal depth. U interpolation takes the shortest seam path; canvas-edge dabs wrap. Missed raycasts break the polyline. Undo replays vectors over a flattened checkpoint, preserving older drawing beyond the latest 24 undo commands. Very long strokes segment to bound command memory. Persisted UVs are quantized to subpixel precision; invalid or unavailable storage is ignored safely.

`Gestures.ts` owns DOM PointerEvents and capture independently of mesh event abstractions. Promotion commits a stroke before rotating, and remaining fingers wait for full release. Mouse Alt + drag, a rotation tool and keyboard-operable arrow buttons provide alternatives. Renderer DPR is capped at 1.75. Rendering is requested only when drawing, pose, size or visibility changes; there is no idle 3D render loop.

PNG export renders the model with its current pose to a transparent 1024² offscreen target, reads back and flips pixels, then disposes the target. `preserveDrawingBuffer` stays disabled. Where file sharing exists it is attempted first; rejected/unsupported sharing exposes download and an image link for long-press save. Cancellation leaves the drawing intact. Native iOS save behavior remains a physical-device check.

`useAudioPlayer.ts` owns one audio instance. Entry requests playback synchronously in the click handler, then fades on home reveal. Manual mute overrides navigation; direct home and blocked playback wait for an explicit tap. Returning does not reload or seek. Audio state follows real playing, pause and error events.

`CandyRain.tsx` uses a transparent nine-tile WebP atlas and CSS transforms, capped at 14 mobile/22 desktop sprites across the full viewport. `DraggableCandy.tsx` captures mouse/touch pointers, pauses the fall while held and resumes from the drop point. Dragging does not trigger a pop; a tap or keyboard activation still does. Rare gold candy has a larger sprite, bright halo and glinting stars. Popping gold reveals the owner's configured messages. Background visibility pauses animation and spawning; reduced motion uses four stationary, draggable candies. Hotspots use image-relative anchors. Signs and ghost are native SVG/HTML overlays, so the dog artwork is never repainted. The pumpkin return and sound controls are fixed at opposite bottom corners.

All event text, prompts and outbound destinations come from `siteContent.ts`, including generated HTML metadata. URLs are validated as HTTPS and restricted to the relevant providers; all external anchors use `noopener noreferrer`. Assets and self-hosted fonts are served locally, with relative URLs for static subdirectory hosting. No API keys or remote services are required.

## Automated verification

- Strict TypeScript compilation and the Vite production build.
- Five core tests: zone-safe dates, live/completed countdown math, safe provider links, shortest seam interpolation and damaged persistence.
- Twenty-five browser tests: first-stroke progressive controls and a single entry action; erase/undo/reset; reload and pose restore; two/three-pointer promotion/demotion; transparent PNG dimensions and pixel alpha; single-instance audio/mute/navigation; blocked/direct-home audio; pending links and scene interactions; gold candy; complete scene at 320/360/390/430px; WebGL/storage denial; keyboard/dialog focus and reduced motion; seam/checkpoint pixel assertions; rear carving; native-share invocation/rejection fallback; quota failure; configured event/links; elapsed countdown; narrow carving layout; full-width candy placement; mouse/touch dragging, release and cancellation; stronger gold styling; and fixed return/sound controls.
- Browser tests also reject uncaught page errors. Screenshots are written under ignored `test-results/` for visual inspection.
- A production-artifact smoke check serves `dist/` under `/invitation/` without a SPA fallback and verifies direct home, deferred 3D download, carving, PNG export, return navigation and every requested asset. Production dependencies had zero reported advisories at verification time.

The tests run in Microsoft Edge on Windows, with software WebGL for automation. Touch tests use the browser's actual touch-input dispatch, rather than manually invoking application callbacks. This verifies browser behavior but cannot establish physical-device frame rates or Safari-specific policies. Physical iOS Safari, Android Chrome, landscape and poor-network trials remain release checks from the original device matrix.

## Launch boundaries

The website implementation works with the handoff's intentional TBD/pending content. A live party launch still needs the owner to supply the actual date/time, accurate gate destination, WhatsApp group and Spotify collaborator invite, plus the optional custom soundtrack. These values cannot be inferred from the supplied files. Configured valid values activate the existing UI without component edits.

No public deployment was performed as part of the local workspace build. `dist/` is the deployment artifact. Hosting credentials, a production hostname and live event data are not needed for local review.

An automatic GitHub Pages workflow is now included. See [GitHub Pages setup](GITHUB_PAGES.md); it validates pushes and pull requests and deploys successful default-branch builds once Pages is enabled in the repository.
