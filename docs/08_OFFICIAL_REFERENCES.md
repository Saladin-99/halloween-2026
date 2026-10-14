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
