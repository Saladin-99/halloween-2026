import { useCallback, useEffect, useRef, useState } from 'react';
import { siteContent as c } from '../config/siteContent';
import { assetUrl } from '../lib/content';
import { keys, readStorage, writeStorage } from '../lib/storage';
import { ShufflePlaylist } from '../lib/shufflePlaylist';
import tracks from 'virtual:ambient-tracks';

type Status = 'idle' | 'playing' | 'muted' | 'blocked' | 'unavailable';

export function useAudioPlayer(homeRevealed: boolean) {
  const [{ audio, playlist }] = useState(() => {
    const playlist = new ShufflePlaylist(tracks);
    const first = playlist.next();
    const audio = new Audio();
    audio.loop = false; audio.preload = 'none';
    if (first) audio.src = assetUrl(first);
    return { audio, playlist };
  });
  const [soundPreference] = useState(() => readStorage(keys.mute));
  const muted = useRef(soundPreference === 'true');
  const restorePending = useRef(soundPreference === 'false');
  const restoreAttempted = useRef(false);
  const [restoreBlocked, setRestoreBlocked] = useState(false);
  const [status, setStatus] = useState<Status>(!playlist.tracks.length ? 'unavailable' : muted.current ? 'muted' : 'idle');
  const started = useRef(false);
  const frame = useRef(0);
  const generation = useRef(0);
  const alive = useRef(true);
  const failedTracks = useRef(new Set<string>());
  const handleFailure = useRef<() => void>(() => {});

  // Called directly in the user's click. Keep play() before any awaits or timers.
  const play = useCallback((fade: boolean, continueMuted = false) => {
    if (!playlist.tracks.length) { setStatus('unavailable'); return; }
    if (muted.current && !continueMuted) { setStatus('muted'); return; }
    if (!audio.paused && !audio.ended && started.current) return;
    const request = ++generation.current;
    audio.muted = muted.current; audio.volume = fade ? 0.001 : c.tuning.ambientVolume;
    started.current = true;
    void audio.play().then(() => {
      if (alive.current && request === generation.current) setStatus(muted.current ? 'muted' : 'playing');
    }).catch(error => {
      if (!alive.current || request !== generation.current) return;
      if (error instanceof DOMException && error.name === 'NotSupportedError') handleFailure.current();
      else {
        setRestoreBlocked(restorePending.current && error instanceof DOMException && error.name === 'NotAllowedError');
        setStatus(muted.current ? 'muted' : 'blocked');
      }
    });
  }, [audio, playlist]);

  const advance = useCallback(() => {
    if (failedTracks.current.size >= playlist.tracks.length) {
      generation.current++; cancelAnimationFrame(frame.current);
      audio.pause(); setStatus(muted.current ? 'muted' : 'blocked'); return;
    }
    let next: string | null = null;
    for (let i = 0; i < playlist.tracks.length * 2; i++) {
      const candidate = playlist.next();
      if (candidate && !failedTracks.current.has(candidate)) { next = candidate; break; }
    }
    generation.current++; cancelAnimationFrame(frame.current);
    if (!next) { audio.pause(); setStatus(muted.current ? 'muted' : 'blocked'); return; }
    started.current = false;
    audio.src = assetUrl(next);
    play(false, true);
  }, [audio, playlist, play]);

  handleFailure.current = () => {
    if (!alive.current || !started.current || !playlist.current) return;
    failedTracks.current.add(playlist.current); advance();
  };

  useEffect(() => {
    alive.current = true;
    const playing = () => {
      if (!alive.current) return;
      restorePending.current = false; setRestoreBlocked(false);
      writeStorage(keys.mute, String(muted.current));
      setStatus(muted.current ? 'muted' : 'playing');
    };
    const interrupted = () => {
      if (alive.current && started.current && !audio.ended && !audio.error) setStatus(muted.current ? 'muted' : 'blocked');
    };
    const ended = () => { if (alive.current && started.current) advance(); };
    const error = () => { if (audio.error) handleFailure.current(); };
    audio.addEventListener('playing', playing); audio.addEventListener('pause', interrupted);
    audio.addEventListener('ended', ended); audio.addEventListener('error', error);
    return () => {
      alive.current = false; generation.current++; cancelAnimationFrame(frame.current);
      audio.removeEventListener('playing', playing); audio.removeEventListener('pause', interrupted);
      audio.removeEventListener('ended', ended); audio.removeEventListener('error', error); audio.pause();
    };
  }, [audio, advance]);

  useEffect(() => {
    if (!restorePending.current || restoreAttempted.current) return;
    restoreAttempted.current = true;
    play(false);
  }, [play]);

  useEffect(() => {
    if (!restoreBlocked) return;
    const retry = (event: PointerEvent | KeyboardEvent) => {
      if (muted.current || !restorePending.current) return;
      // Let the sound button handle its own click, so a pointerdown retry
      // cannot turn its following click into an accidental mute.
      if (event.target instanceof Element && event.target.closest('.sound-button')) return;
      if (event instanceof KeyboardEvent && (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.key === 'Escape')) return;
      play(false);
    };
    document.addEventListener('pointerdown', retry, true);
    document.addEventListener('keydown', retry, true);
    return () => {
      document.removeEventListener('pointerdown', retry, true);
      document.removeEventListener('keydown', retry, true);
    };
  }, [restoreBlocked, play]);

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
      restorePending.current = false; setRestoreBlocked(false);
      muted.current = true; audio.muted = true; generation.current++; cancelAnimationFrame(frame.current);
      writeStorage(keys.mute, 'true'); setStatus('muted');
    } else {
      muted.current = false; audio.muted = false; writeStorage(keys.mute, 'false');
      if (audio.paused || audio.ended) {
        failedTracks.current.clear();
        if (audio.error) { generation.current++; audio.load(); }
        play(false);
      }
      else { audio.volume = c.tuning.ambientVolume; setStatus('playing'); }
    }
  }, [audio, play, status]);
  return { status, remembered: soundPreference === 'true' || soundPreference === 'false', enter: () => play(true), toggle };
}
