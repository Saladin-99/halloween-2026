type Name = 'arrow' | 'back' | 'sound' | 'mute' | 'carve' | 'erase' | 'undo' | 'reset' | 'save' | 'rotate' | 'pin' | 'headphones' | 'close' | 'moon' | 'paw' | 'sparkle' | 'smoke' | 'bottle' | 'whatsapp' | 'calendar' | 'clock' | 'pumpkin';
const paths: Record<Name, React.ReactNode> = {
  pumpkin: <><path d="M12 7c-1-3 0-5 3-5M12 8C2 3-2 20 9 21h6C26 20 22 3 12 8Z" /><ellipse cx="12" cy="14" rx="4" ry="7" /></>,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  back: <path d="M19 12H5m5-5-5 5 5 5" />,
  sound: <><path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
  mute: <><path d="m11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6" /></>,
  carve: <><path d="m5 17 2 2L20 6l-2-2L5 17Zm0 0-2 4 4-2M14 8l2 2" /></>,
  erase: <path d="m3 14 9-10a2 2 0 0 1 3 0l6 6a2 2 0 0 1 0 3l-7 8H9l-6-4a2 2 0 0 1 0-3Zm4-4 9 9M9 21h13" />,
  undo: <path d="M8 4 3 9l5 5M3 9h11a7 7 0 0 1 0 14" />,
  reset: <path d="M4 8a9 9 0 1 1-1 8M4 3v5h5" />,
  save: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
  rotate: <><path d="M20 8a9 9 0 0 0-15-3L2 8m0-5v5h5M4 16a9 9 0 0 0 15 3l3-3m0 5v-5h-5" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  headphones: <><path d="M4 13v-2a8 8 0 0 1 16 0v2M4 12h3v9H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Zm16 0h-3v9h3a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2Z" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  moon: <path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z" />,
  paw: <><ellipse cx="12" cy="16" rx="5" ry="4" /><ellipse cx="5" cy="9" rx="2" ry="3" /><ellipse cx="10" cy="5" rx="2" ry="3" /><ellipse cx="16" cy="6" rx="2" ry="3" /><ellipse cx="20" cy="11" rx="2" ry="3" /></>,
  sparkle: <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" />,
  smoke: <><path d="M3 14h15v5H3zM15 14v5m6-5v5M9 10c-5-4 4-3 0-8m6 8c-5-4 4-3 0-8" /></>,
  bottle: <path d="M9 2h6v5l3 4v10H6V11l3-4V2Zm-3 12h12M9 5h6" />,
  whatsapp: <><path d="M21 11.5a9 9 0 0 1-13.5 8L2 21l1.5-5.5A9 9 0 1 1 21 11.5Z" /><path d="M8 7c-2 3 3 8 6 8l2-2-3-1-1 1-2-2 1-1-1-3H8Z" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 2v6m10-6v6M3 11h18" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></>,
};
export function Icon({ name, className = '' }: { name: Name; className?: string }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
