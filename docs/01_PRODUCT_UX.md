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
