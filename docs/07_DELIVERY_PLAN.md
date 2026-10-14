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
