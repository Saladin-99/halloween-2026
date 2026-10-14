import { useEffect, useRef, useState } from 'react';
import { siteContent as c } from '../config/siteContent';
import { external } from '../lib/content';
import { CandyRain } from './CandyRain';
import { EventDetails } from './EventDetails';
import { Icon } from './Icon';
import { VenueScene } from './VenueScene';

export function InvitationHome({ reduced, onBack }: { reduced: boolean; onBack: () => void }) {
  const [message, setMessage] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), c.tuning.messageDurationMs);
    return () => clearTimeout(timer);
  }, [message]);
  return <main className="invitation-home">
    <CandyRain reduced={reduced} onSecret={setMessage} />
    <div className="invitation-shell">
      <header className="home-header">
        <div className="eyebrow"><span className="eyebrow-line" /><span>{c.identity.subtitle}</span><span className="eyebrow-line" /></div>
        <h1 ref={heading} tabIndex={-1} aria-label={c.identity.partyTitle}>{c.copy.home.titleLines.map((line, i) => <span key={line} className={`title-line title-line-${i}`}>{line}</span>)}</h1>
        <p className="welcome-line"><span className="tiny-star">✦</span>{c.copy.home.welcome}<span className="tiny-star">✦</span></p>
      </header>
      <div className="venue-wrap"><VenueScene reduced={reduced} onMessage={setMessage} /><p className="explore-note"><Icon name="sparkle" />{c.copy.home.explore}</p></div>
      <EventDetails />
      <div className="home-actions">
        {external.whatsapp ? <a className="primary-button rsvp-button" href={external.whatsapp} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" />{c.copy.home.rsvpAction}<Icon name="arrow" /></a> : <><button className="primary-button rsvp-button" disabled aria-describedby="rsvp-unavailable"><Icon name="whatsapp" />{c.copy.home.rsvpAction}<Icon name="arrow" /></button><p id="rsvp-unavailable" className="rsvp-note">{c.copy.home.rsvpUnavailable}</p></>}
        <button className="back-button" onClick={onBack}><Icon name="back" />{c.copy.home.backToPumpkin}</button>
      </div>
    </div>
    {message && <div className="scene-toast" role="status"><Icon name="sparkle" /><span>{message}</span><button className="icon-button" onClick={() => setMessage('')} aria-label={c.copy.general.dismiss}><Icon name="close" /></button></div>}
  </main>;
}
