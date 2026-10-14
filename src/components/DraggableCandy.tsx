import { useEffect, useRef, type CSSProperties, type PointerEvent } from 'react';
import { siteContent as c } from '../config/siteContent';
import { assetUrl } from '../lib/content';

export type Candy = { id: number; sprite: number; x: number; duration: number; drift: number; size: number; delay: number; gold: boolean; popped: boolean };
type Drag = { pointer: number; x: number; y: number; centerX: number; centerY: number; moved: boolean };

export function DraggableCandy({ candy, index, onPop, onRecycle }: {
  candy: Candy; index: number; onPop: (candy: Candy) => void; onRecycle: (id: number) => void;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const restartFrame = useRef(0);

  const resumeFromDrop = (element: HTMLButtonElement) => {
    const rect = element.getBoundingClientRect();
    const left = rect.left + rect.width / 2 - 22;
    const top = rect.top + rect.height / 2 - 22;
    const transform = getComputedStyle(element).transform;
    const matrix = new DOMMatrixReadOnly(transform === 'none' ? undefined : transform);
    const angle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
    const distance = window.innerHeight - top + 80;
    const speed = (window.innerHeight + 140) / candy.duration;

    // Rebase the existing CSS fall at the drop point, preserving its current rotation.
    // Pointer moves only update a transform; React never renders for each move.
    element.style.animation = 'none';
    element.style.left = `${left}px`; element.style.top = `${top}px`;
    element.style.translate = 'none'; element.style.transform = `rotate(${angle}deg)`;
    element.style.setProperty('--fall-start', '0px');
    element.style.setProperty('--fall-distance', `${distance}px`);
    element.style.setProperty('--duration', `${Math.max(0.6, distance / speed)}s`);
    element.style.setProperty('--delay', '0s');
    element.style.setProperty('--start-angle', `${angle}deg`);
    element.style.setProperty('--end-angle', `${angle + 205}deg`);
    element.style.setProperty('--drift', `${Math.max(-left, Math.min(candy.drift, window.innerWidth - 44 - left))}px`);
    cancelAnimationFrame(restartFrame.current);
    restartFrame.current = requestAnimationFrame(() => {
      restartFrame.current = 0;
      element.style.animation = ''; element.style.transform = '';
    });
  };

  const finish = (cancelled: boolean, pointer?: number) => {
    const active = drag.current, element = button.current;
    if (!active || !element || (pointer !== undefined && pointer !== active.pointer)) return;
    drag.current = null;
    suppressClick.current = cancelled || active.moved;
    if (active.moved) resumeFromDrop(element);
    element.classList.remove('held');
    if (element.hasPointerCapture(active.pointer)) element.releasePointerCapture(active.pointer);
  };

  useEffect(() => {
    const release = () => finish(true);
    const visibility = () => { if (document.hidden) release(); };
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      drag.current = null; cancelAnimationFrame(restartFrame.current);
      window.removeEventListener('blur', release); document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  const down = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || candy.popped || drag.current) return;
    const element = event.currentTarget;
    if (restartFrame.current) {
      cancelAnimationFrame(restartFrame.current); restartFrame.current = 0;
      element.style.animation = ''; element.style.transform = '';
    }
    element.classList.add('held');
    const rect = element.getBoundingClientRect();
    suppressClick.current = false;
    drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2, moved: false };
    element.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    const dx = event.clientX - active.x, dy = event.clientY - active.y;
    if (!active.moved && Math.hypot(dx, dy) < c.tuning.candyDragThresholdPx) return;
    active.moved = true; event.preventDefault();
    event.currentTarget.classList.add('was-dragged');
    const x = Math.max(22 - active.centerX, Math.min(dx, window.innerWidth - 22 - active.centerX));
    const y = Math.max(22 - active.centerY, Math.min(dy, window.innerHeight - 22 - active.centerY));
    event.currentTarget.style.translate = `${x}px ${y}px`;
  };

  return <button ref={button}
    data-candy-id={candy.id}
    className={`falling-candy ${candy.gold ? 'gold-candy' : ''} ${candy.popped ? 'popped' : ''}`}
    style={{ '--x': candy.x, '--duration': `${candy.duration}s`, '--drift': `${candy.drift}px`, '--delay': `${candy.delay}s`, '--size': `${candy.size}px`, '--rest-y': `${15 + (index % 4) * 22}vh` } as CSSProperties}
    aria-label={candy.gold ? c.copy.environment.goldCandyHint : c.copy.environment.candyHint}
    title={c.copy.environment.candyInstruction}
    onPointerDown={down} onPointerMove={move}
    onPointerUp={event => finish(false, event.pointerId)}
    onPointerCancel={event => finish(true, event.pointerId)}
    onLostPointerCapture={event => finish(true, event.pointerId)}
    onClick={event => {
      if (event.detail !== 0 && suppressClick.current) { suppressClick.current = false; return; }
      if (!candy.popped) onPop(candy);
    }}
    onAnimationEnd={event => { if (event.target === event.currentTarget && event.animationName === 'candy-fall' && !candy.popped) onRecycle(candy.id); }}>
    <span className="candy-sprite" style={{ backgroundImage: `url(${assetUrl(c.assets.candyAtlas)})`, backgroundPosition: `${candy.sprite / 8 * 100}% 0` }} />
    {candy.gold && <span className="gold-sparkles" aria-hidden="true"><i /><i /><i /></span>}
    {candy.popped && <span className="pop-sparkle" aria-hidden="true">✦</span>}
  </button>;
}
