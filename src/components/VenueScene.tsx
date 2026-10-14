import { useEffect, useState, type CSSProperties } from 'react';
import { siteContent as c } from '../config/siteContent';
import { assetUrl, external } from '../lib/content';
import { Dialog } from './Dialog';
import { Icon } from './Icon';

type Panel = 'gate' | 'playlist' | null;

export function VenueScene({ reduced, onMessage }: { reduced: boolean; onMessage: (message: string) => void }) {
  const [moonlit, setMoonlit] = useState(false);
  const [palette, setPalette] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [dog, setDog] = useState(false);
  const [ghost, setGhost] = useState(false);
  useEffect(() => {
    if (!dog) return;
    const timer = setTimeout(() => setDog(false), c.tuning.messageDurationMs);
    return () => clearTimeout(timer);
  }, [dog]);
  useEffect(() => {
    if (reduced) return;
    const interval = setInterval(() => { if (!document.hidden) setGhost(true); }, c.tuning.ghostDelayMs);
    return () => clearInterval(interval);
  }, [reduced]);
  const anchor = (key: keyof typeof c.tuning.sceneHotspots): CSSProperties => {
    const point = c.tuning.sceneHotspots[key]; return { left: `${point.x * 100}%`, top: `${point.y * 100}%` };
  };
  return <>
    <div className={`scene-card ${moonlit ? 'moonlit' : ''} palette-${palette}`}>
      <picture>
        <source type="image/webp" srcSet={`${assetUrl(c.assets.sceneSrc480)} 480w, ${assetUrl(c.assets.sceneSrc800)} 800w, ${assetUrl(c.assets.sceneSrc1254)} 1254w`} sizes="(max-width: 700px) calc(100vw - 24px), 620px" />
        <img src={assetUrl(c.assets.sceneSrc800)} alt={c.copy.general.imageAlt} width="1254" height="1254" fetchPriority="high" />
      </picture>
      <div className="moon-wash" aria-hidden="true" />
      <button className="scene-hotspot moon-hotspot" style={anchor('moon')} aria-label={c.copy.environment.moonHint} aria-pressed={moonlit} onClick={() => setMoonlit(value => !value)}><span className="hotspot-ring" /></button>
      <button className="scene-hotspot dog-hotspot" style={anchor('dog')} aria-label={c.copy.environment.dogHint} onClick={() => { setDog(true); onMessage(c.copy.environment.dogBubble); }}>{dog && <span className="paw-sparkle"><Icon name="paw" /></span>}</button>
      <button className="scene-hotspot gate-hotspot" style={anchor('gate')} aria-label={c.copy.environment.gateHint} onClick={() => setPanel('gate')}><span className="hotspot-bead"><Icon name="pin" /></span></button>
      <button className="scene-hotspot lights-hotspot" style={anchor('lights')} aria-label={c.copy.environment.stringLightsHint} onClick={() => setPalette(value => (value + 1) % 3)}><span className="hotspot-ring" /></button>
      <button className="scene-hotspot headphones-hotspot" style={anchor('headphones')} aria-label={c.copy.environment.playlistHint} onClick={() => setPanel('playlist')}><span className="prop-headphones"><Icon name="headphones" /></span></button>
      <span className="scene-prop smoking-sign" style={anchor('smokeSign')} role="img" aria-label={c.copy.environment.smokeSign} title={c.copy.environment.smokeSign}><Icon name="smoke" /></span>
      <span className="scene-prop drinks-sign" style={anchor('drinksSign')} role="img" aria-label={c.copy.environment.drinksSign} title={c.copy.environment.drinksSign}><Icon name="bottle" /></span>
      <span className="scene-prop byob-sign" style={anchor('byobSign')}>{c.copy.environment.byobSign}</span>
      {ghost && <button className="scene-ghost" aria-label={c.copy.environment.ghostHint} onClick={() => { setGhost(false); onMessage(c.copy.environment.ghostMessage); }} onAnimationEnd={() => setGhost(false)}><svg viewBox="0 0 60 70" aria-hidden="true"><path d="M10 60V29a20 20 0 0 1 40 0v31l-10-7-10 8-10-8-10 7Z" fill="#eaddff" fillOpacity=".8" /><ellipse cx="23" cy="30" rx="3" ry="5" fill="#362342" /><ellipse cx="38" cy="30" rx="3" ry="5" fill="#362342" /></svg></button>}
    </div>
    {panel === 'gate' && <Dialog title={c.copy.environment.gateHint} onClose={() => setPanel(null)}><p>{c.event.locationLabel}</p>{c.event.locationLinkStatus !== 'verified' && <p className="muted">{c.copy.home.approximateMap}</p>}{external.maps && <a className="primary-button" href={external.maps} target="_blank" rel="noopener noreferrer">{c.copy.home.mapAction}<Icon name="arrow" /></a>}</Dialog>}
    {panel === 'playlist' && <Dialog title={c.copy.environment.playlistHint} onClose={() => setPanel(null)}><Icon className="playlist-icon" name="headphones" />{c.links.spotifyLinkStatus === 'collaboration-invite' && external.spotify ? <a className="primary-button" href={external.spotify} target="_blank" rel="noopener noreferrer">{c.copy.environment.playlistAction}<Icon name="arrow" /></a> : <><p className="muted">{c.copy.environment.playlistPlaceholderNote}</p><button className="primary-button" disabled>{c.copy.environment.playlistAction}</button></>}</Dialog>}
  </>;
}
