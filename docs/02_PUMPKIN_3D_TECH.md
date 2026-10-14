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
