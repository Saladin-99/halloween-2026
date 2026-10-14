import { useCallback, useEffect, useRef, useState } from 'react';
import { siteContent as c } from '../config/siteContent';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { keys, readStorage, writeStorage } from '../lib/storage';
import { PumpkinStage } from '../components/PumpkinStage';
import { InvitationHome } from '../components/InvitationHome';
import { TransitionOverlay } from '../components/TransitionOverlay';
import { Icon } from '../components/Icon';

type View = 'pumpkin' | 'home';
const route = (): View => new URLSearchParams(window.location.search).get('view') === 'home' ? 'home' : 'pumpkin';

export function App() {
  const [view, setView] = useState<View>(route);
  const [pumpkinMounted, setPumpkinMounted] = useState(() => route() === 'pumpkin');
  const [visited, setVisited] = useState(() => route() === 'home' || readStorage(keys.entered, true) === 'true');
  const [homeRevealed, setHomeRevealed] = useState(route() === 'home');
  const [transition, setTransition] = useState<{ duration: number; quick: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useReducedMotion();
  const audio = useAudioPlayer(homeRevealed);
  const navigating = useRef(false);
  useEffect(() => {
    document.title = c.identity.documentTitle;
    document.querySelector('meta[name="description"]')?.setAttribute('content', c.identity.description);
    const pop = () => {
      if (timer.current) clearTimeout(timer.current);
      navigating.current = false; setTransition(null);
      const next = route(); setView(next);
      if (next === 'pumpkin') setPumpkinMounted(true);
      if (next === 'home') { setVisited(true); setHomeRevealed(true); writeStorage(keys.entered, 'true', true); }
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', pop);
    return () => { window.removeEventListener('popstate', pop); if (timer.current) clearTimeout(timer.current); };
  }, []);

  const setRoute = useCallback((next: View) => {
    if (next === 'pumpkin') setPumpkinMounted(true);
    const url = new URL(window.location.href); url.searchParams.set('view', next);
    if (route() !== next) history.pushState({ view: next }, '', url);
    setView(next); window.scrollTo(0, 0);
  }, []);

  const enter = () => {
    if (navigating.current) return;
    navigating.current = true;
    audio.enter();
    const duration = reduced ? c.tuning.reducedTransitionMs : visited ? c.tuning.returnTransitionMs : c.tuning.introTransitionMs;
    setTransition({ duration, quick: visited });
    timer.current = setTimeout(() => {
      setRoute('home'); setHomeRevealed(true); setVisited(true); writeStorage(keys.entered, 'true', true);
      setTransition(null); navigating.current = false;
    }, duration);
  };
  const audioLabel = audio.status === 'playing' ? c.copy.home.audioMute : audio.status === 'blocked' ? c.copy.home.audioBlocked : c.copy.home.audioUnmute;
  return <>
    {pumpkinMounted && <PumpkinStage active={view === 'pumpkin'} visited={visited} onEnter={enter} />}
    {view === 'home' && <InvitationHome reduced={reduced} />}
    {view === 'home' && <button className="floating-control pumpkin-return-button" aria-label={c.copy.home.backToPumpkin} title={c.copy.home.backToPumpkin} onClick={() => setRoute('pumpkin')}><Icon name="pumpkin" /><span>{c.copy.home.backToPumpkin}</span></button>}
    {visited && <button className="floating-control sound-button" aria-label={audioLabel} onClick={audio.toggle} title={audioLabel} aria-pressed={audio.status === 'playing'}><Icon name={audio.status === 'playing' ? 'sound' : 'mute'} /><span>{audio.status === 'playing' ? c.copy.home.audioPlaying : audio.status === 'blocked' ? c.copy.home.audioBlocked : c.copy.home.audioOff}</span></button>}
    {transition && <TransitionOverlay duration={transition.duration} quick={transition.quick} reduced={reduced} />}
  </>;
}
