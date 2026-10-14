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
