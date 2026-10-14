import { useCallback, useEffect, useRef, useState } from 'react';
import { siteContent as c } from '../config/siteContent';
import { assetUrl } from '../lib/content';
import { keys, readStorage, writeStorage } from '../lib/storage';

type Status = 'idle' | 'playing' | 'muted' | 'blocked';

export function useAudioPlayer(homeRevealed: boolean) {
  const [audio] = useState(() => { const element = new Audio(assetUrl(c.assets.ambientAudio)); element.loop = true; element.preload = 'none'; return element; });
  const muted = useRef(readStorage(keys.mute) === 'true');
  const [status, setStatus] = useState<Status>(muted.current ? 'muted' : 'idle');
  const started = useRef(false);
  const frame = useRef(0);
  const generation = useRef(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const playing = () => { if (alive.current) setStatus(muted.current ? 'muted' : 'playing'); };
    const interrupted = () => { if (alive.current) setStatus(muted.current ? 'muted' : 'blocked'); };
    audio.addEventListener('playing', playing); audio.addEventListener('pause', interrupted); audio.addEventListener('error', interrupted);
    return () => {
      alive.current = false; generation.current++; cancelAnimationFrame(frame.current);
      audio.removeEventListener('playing', playing); audio.removeEventListener('pause', interrupted); audio.removeEventListener('error', interrupted); audio.pause();
    };
  }, [audio]);

  // Called directly in the user's click. Keep play() before any awaits or timers.
  const play = useCallback((fade: boolean) => {
    if (muted.current) { setStatus('muted'); return; }
    if (!audio.paused && started.current) return;
    const request = ++generation.current;
    audio.muted = false; audio.volume = fade ? 0.001 : c.tuning.ambientVolume;
    started.current = true;
    void audio.play().then(() => {
      if (alive.current && request === generation.current) setStatus(muted.current ? 'muted' : 'playing');
    }).catch(() => { if (alive.current && request === generation.current) setStatus(muted.current ? 'muted' : 'blocked'); });
  }, [audio]);

  useEffect(() => {
    if (!homeRevealed || status !== 'playing' || muted.current) return;
    const start = performance.now(), from = audio.volume;
    const fade = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - start) / c.tuning.soundFadeInMs));
      audio.volume = from + (c.tuning.ambientVolume - from) * progress;
      if (now - start < c.tuning.soundFadeInMs) frame.current = requestAnimationFrame(fade);
    };
    frame.current = requestAnimationFrame(fade);
    return () => cancelAnimationFrame(frame.current);
  }, [audio, homeRevealed, status]);

  const toggle = useCallback(() => {
    if (status === 'playing') {
      muted.current = true; audio.muted = true; generation.current++; cancelAnimationFrame(frame.current);
      writeStorage(keys.mute, 'true'); setStatus('muted');
    } else {
      muted.current = false; audio.muted = false; writeStorage(keys.mute, 'false');
      if (audio.paused) play(false); else { audio.volume = c.tuning.ambientVolume; setStatus('playing'); }
    }
  }, [audio, play, status]);
  return { status, enter: () => play(true), toggle };
}
