import { useEffect, useState } from 'react';
import { siteContent as c } from '../config/siteContent';
import { countdown, eventInstant, external } from '../lib/content';
import { Icon } from './Icon';

export function EventDetails() {
  const target = eventInstant(c.event.partyStartsAtIso);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (target === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target]);
  const remaining = target !== null ? countdown(target, now) : null;
  const date = target === null ? c.event.datePlaceholder : new Intl.DateTimeFormat('en-GB', { timeZone: c.event.timeZone, weekday: 'short', day: 'numeric', month: 'long' }).format(target);
  const time = target === null ? c.event.timePlaceholder : new Intl.DateTimeFormat('en-GB', { timeZone: c.event.timeZone, hour: 'numeric', minute: '2-digit', hour12: true }).format(target);
  return <div className="event-details">
    <div className="date-time-row">
      <div><Icon name="calendar" /><span><span className="detail-label">{c.copy.home.dateLabel}</span><strong>{date}</strong></span></div>
      <span className="detail-divider" />
      <div><Icon name="clock" /><span><span className="detail-label">{c.copy.home.timeLabel}</span><strong>{time}</strong></span></div>
    </div>
    <div className="location-block"><span className="detail-label">{c.copy.home.locationLabel}</span>
      {external.maps ? <a href={external.maps} target="_blank" rel="noopener noreferrer"><Icon name="pin" /><span>{c.event.locationLabel}</span><Icon name="arrow" /></a> : <p>{c.event.locationLabel}</p>}
      {c.event.locationLinkStatus !== 'verified' && <span className="map-note">{c.copy.home.approximateMap}</span>}
    </div>
    <div className="countdown-block"><span className="detail-label">{c.copy.home.countdownTitle}</span>
      {!remaining ? <span className="countdown-pending">{c.copy.home.countdownPending}<span aria-hidden="true"> ✦</span></span> : remaining.complete ? <strong>{c.copy.home.countdownComplete}</strong> : <div className="countdown-numbers" role="timer">{(['days', 'hours', 'minutes', 'seconds'] as const).map((unit, index) => <div key={unit}><strong>{String(remaining[unit]).padStart(2, '0')}</strong><span>{[c.copy.home.countdownDays, c.copy.home.countdownHours, c.copy.home.countdownMinutes, c.copy.home.countdownSeconds][index]}</span></div>)}</div>}
    </div>
  </div>;
}
