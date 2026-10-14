import { siteContent } from '../config/siteContent';

/** Keep public assets relative so the build also works in a static subdirectory. */
export function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}

export function safeExternalUrl(value: string, kind: 'whatsapp' | 'maps' | 'spotify') {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (kind === 'whatsapp' && url.hostname === 'chat.whatsapp.com' && /^\/[A-Za-z0-9_-]{10,}\/?$/.test(url.pathname)) return url.href;
    if (kind === 'spotify' && (url.hostname === 'open.spotify.com' || url.hostname === 'spotify.link')) return url.href;
    if (kind === 'maps' && (url.hostname === 'maps.app.goo.gl' || url.hostname === 'maps.google.com' || ((url.hostname === 'www.google.com' || url.hostname === 'google.com') && url.pathname.startsWith('/maps')))) return url.href;
  } catch { /* An unset or malformed destination has no navigable action. */ }
  return null;
}

export function eventInstant(value: string | null) {
  if (!value || !/(Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

export function countdown(target: number, now: number) {
  const seconds = Math.max(0, Math.floor((target - now) / 1000));
  return { days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24, minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60, complete: target <= now };
}

export const external = {
  whatsapp: safeExternalUrl(siteContent.links.whatsappGroupInviteUrl, 'whatsapp'),
  maps: safeExternalUrl(siteContent.event.locationGoogleMapsUrl, 'maps'),
  spotify: safeExternalUrl(siteContent.links.spotifyPlaylistInviteUrl, 'spotify'),
};
