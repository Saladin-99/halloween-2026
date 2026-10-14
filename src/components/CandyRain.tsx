import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { siteContent as c } from '../config/siteContent';
import { assetUrl } from '../lib/content';

type Candy = { id: number; sprite: number; x: number; duration: number; drift: number; size: number; delay: number; gold: boolean; popped: boolean };

export function CandyRain({ reduced, onSecret }: { reduced: boolean; onSecret: (message: string) => void }) {
  const [candies, setCandies] = useState<Candy[]>([]);
  const [hidden, setHidden] = useState(document.hidden);
  const next = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const max = window.innerWidth < 640 ? c.tuning.maxCandiesMobile : c.tuning.maxCandiesDesktop;

  const make = (existing: Candy[], initial = false): Candy => {
    const gold = existing.filter(candy => candy.gold && !candy.popped).length < c.tuning.rareCandyMaxConcurrent && Math.random() < c.tuning.rareCandyChancePerSpawn;
    return {
      id: next.current++, sprite: gold ? 8 : Math.floor(Math.random() * 8),
      x: Math.random() < 0.5 ? 1 + Math.random() * 9 : 88 + Math.random() * 7,
      duration: c.tuning.fallingCandyMinSeconds + Math.random() * (c.tuning.fallingCandyMaxSeconds - c.tuning.fallingCandyMinSeconds),
      drift: (Math.random() - 0.5) * 30, size: 30 + Math.random() * 18,
      delay: initial ? -Math.random() * 12 : 0, gold, popped: false,
    };
  };
  useEffect(() => {
    const initial: Candy[] = [];
    for (let i = 0; i < (reduced ? 4 : Math.min(8, max)); i++) initial.push(make(initial, true));
    setCandies(initial);
    const visibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { document.removeEventListener('visibilitychange', visibility); timers.current.forEach(clearTimeout); timers.current.clear(); };
    // Start a fresh decorative field only when the motion preference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);
  useEffect(() => {
    if (hidden || reduced) return;
    const interval = setInterval(() => setCandies(previous => previous.length < max ? [...previous, make(previous)] : previous), c.tuning.candySpawnMs);
    return () => clearInterval(interval);
  }, [hidden, reduced, max]);

  const recycle = (id: number) => setCandies(previous => {
    const kept = previous.filter(candy => candy.id !== id);
    return [...kept, make(kept)];
  });
  const pop = (candy: Candy) => {
    if (candy.popped) return;
    if (candy.gold) onSecret(c.copy.environment.rareCandyMessages[Math.floor(Math.random() * c.copy.environment.rareCandyMessages.length)]);
    setCandies(previous => previous.map(item => item.id === candy.id ? { ...item, popped: true } : item));
    const timer = setTimeout(() => { timers.current.delete(timer); recycle(candy.id); }, 500);
    timers.current.add(timer);
  };
  return <div className={`candy-rain ${hidden ? 'paused' : ''} ${reduced ? 'reduced' : ''}`}>
    {candies.map((candy, index) => <button key={candy.id}
      className={`falling-candy ${candy.gold ? 'gold-candy' : ''} ${candy.popped ? 'popped' : ''}`}
      style={{ '--x': `${candy.x}%`, '--duration': `${candy.duration}s`, '--drift': `${candy.drift}px`, '--delay': `${candy.delay}s`, '--size': `${candy.size}px`, '--rest-y': `${15 + (index % 4) * 22}vh` } as CSSProperties}
      aria-label={candy.gold ? c.copy.environment.goldCandyHint : c.copy.environment.candyHint}
      onClick={() => pop(candy)} onAnimationEnd={event => { if (event.target === event.currentTarget && !candy.popped) recycle(candy.id); }}>
      <span className="candy-sprite" style={{ backgroundImage: `url(${assetUrl(c.assets.candyAtlas)})`, backgroundPosition: `${candy.sprite / 8 * 100}% 0` }} />
      {candy.popped && <span className="pop-sparkle" aria-hidden="true">✦</span>}
    </button>)}
  </div>;
}
