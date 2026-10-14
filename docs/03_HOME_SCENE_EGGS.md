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
