import { describe, expect, it } from 'vitest';
import { countdown, eventInstant, safeExternalUrl } from '../src/lib/content';
import { parsePumpkin, wrappedDelta, defaultPose } from '../src/pumpkin/model';

describe('event and external destinations', () => {
  it('leaves an unset date pending and requires a zone-safe instant', () => {
    expect(eventInstant(null)).toBeNull();
    expect(eventInstant('2026-10-31T20:00:00')).toBeNull();
    expect(eventInstant('not-a-date')).toBeNull();
    expect(eventInstant('2026-10-31T20:00:00+02:00')).toBe(Date.UTC(2026, 9, 31, 18));
    expect(eventInstant('2026-10-31T18:00:00Z')).toBe(Date.UTC(2026, 9, 31, 18));
  });
  it('counts actual time across zones and completes without negative values', () => {
    const target = Date.UTC(2026, 9, 31, 18);
    expect(countdown(target, target - 90061000)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1, complete: false });
    expect(countdown(target, target + 10000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, complete: true });
  });
  it('only accepts supported HTTPS providers and real group invite paths', () => {
    expect(safeExternalUrl('', 'whatsapp')).toBeNull();
    expect(safeExternalUrl('javascript:alert(1)', 'maps')).toBeNull();
    expect(safeExternalUrl('https://chat.whatsapp.com.evil.test/abcdefghijk', 'whatsapp')).toBeNull();
    expect(safeExternalUrl('https://user:pass@chat.whatsapp.com/abcdefghijk', 'whatsapp')).toBeNull();
    expect(safeExternalUrl('https://chat.whatsapp.com/abcdefghijk', 'whatsapp')).toBeTruthy();
    expect(safeExternalUrl('https://open.spotify.com', 'spotify')).toBeTruthy();
    expect(safeExternalUrl('https://www.google.com/maps/search/?api=1&query=Maamoura', 'maps')).toBeTruthy();
    expect(safeExternalUrl('https://www.google.com/url?q=evil', 'maps')).toBeNull();
  });
});

describe('carving continuity and persistence', () => {
  it('uses the short path across the back seam in either direction', () => {
    expect(wrappedDelta(0.99, 0.01)).toBeCloseTo(0.02);
    expect(wrappedDelta(0.01, 0.99)).toBeCloseTo(-0.02);
    expect(wrappedDelta(0.3, 0.4)).toBeCloseTo(0.1);
  });
  it('restores a versioned valid drawing and safely rejects damaged storage', () => {
    const valid = { version: 1, strokes: [{ tool: 'carve', radius: 0.012, points: [[0.4, 0.5], null, [0.5, 0.6]], time: 123 }], checkpoint: null, pose: defaultPose, touched: true };
    expect(parsePumpkin(JSON.stringify(valid))).toEqual(valid);
    expect(parsePumpkin('{broken')).toBeNull();
    expect(parsePumpkin(JSON.stringify({ ...valid, version: 2 }))).toBeNull();
    expect(parsePumpkin(JSON.stringify({ ...valid, pose: { ...defaultPose, zoom: 10 } }))).toBeNull();
    expect(parsePumpkin(JSON.stringify({ ...valid, strokes: [{ ...valid.strokes[0], points: [[-1, 3]] }] }))).toBeNull();
  });
});
