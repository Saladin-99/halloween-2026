import type { CSSProperties } from 'react';
import { siteContent as c } from '../config/siteContent';
import { assetUrl } from '../lib/content';

export function TransitionOverlay({ duration, quick, reduced }: { duration: number; quick: boolean; reduced: boolean }) {
  return <div className={`transition-overlay ${quick || reduced ? 'quick' : ''}`} role="status" aria-label={c.copy.transition.title} style={{ '--transition-duration': `${duration}ms` } as CSSProperties}>
    {!quick && <div className="transition-words" aria-hidden="true">{c.copy.transition.title.split(' ').map((word, index) => <span key={word} style={{ '--word-index': index } as CSSProperties}>{word}</span>)}</div>}
    {!quick && !reduced && <div className="candy-burst" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <span key={i} style={{ '--angle': `${i * 30}deg`, '--distance': `${30 + i % 3 * 7}vmin`, backgroundImage: `url(${assetUrl(c.assets.candyAtlas)})`, backgroundPosition: `${i % 8 / 8 * 100}% 0` } as CSSProperties} />)}</div>}
  </div>;
}
