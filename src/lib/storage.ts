export const keys = {
  pumpkin: 'ma3moora-halloween:v1:pumpkin',
  mute: 'ma3moora-halloween:v1:mute',
  entered: 'ma3moora-halloween:v1:entered',
};

export function readStorage(key: string, session = false): string | null {
  try { return (session ? sessionStorage : localStorage).getItem(key); } catch { return null; }
}

export function writeStorage(key: string, value: string, session = false) {
  try { (session ? sessionStorage : localStorage).setItem(key, value); return true; } catch { return false; }
}
