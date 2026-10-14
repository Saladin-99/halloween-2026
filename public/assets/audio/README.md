# Ambient playlist

Drop your music files directly in this folder, then rebuild/redeploy the website. No playlist file needs editing. Configure a different folder with `siteContent.assets.ambientAudioFolder` (a web path inside `public/`).

The build discovers MP3, M4A, AAC, OGG/OGA, WAV, WEBM, OPUS and FLAC files. MP3 is recommended for broad browser compatibility; actual playback depends on the file's encoding and browser. Non-audio files and nested folders are ignored.

Playback chooses a fresh random order on every page load. Each track is used once per shuffle cycle; a new shuffle starts after the cycle finishes. Immediate repeats across cycle boundaries are avoided when there are at least two tracks. Mute and returning to the pumpkin keep the same player and cycle.

Refresh remembers whether music was on or muted. Previously enabled music resumes automatically when permitted by the browser, otherwise on the next interaction. First-time visitors still start silently. The track order always starts a fresh shuffle after refresh.

The supplied `placeholder-ambient.mp3` is the original demo track. Remove it when you add your own tracks if you do not want it in the shuffle. Asset regeneration leaves this folder's contents alone.
