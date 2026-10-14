import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { ShufflePlaylist } from '../src/lib/shufflePlaylist';
import { discoverAmbientTracks } from '../scripts/ambient-audio';

describe('shuffle cycles', () => {
  it('uses every track once per cycle and avoids repeating at the boundary', () => {
    const files = ['a.mp3', 'b.mp3', 'c.mp3', 'd.mp3'];
    let seed = 42;
    const playlist = new ShufflePlaylist(files, () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; });
    let previous: string | null = null;
    for (let cycle = 0; cycle < 20; cycle++) {
      const songs = files.map(() => playlist.next());
      expect(new Set(songs)).toEqual(new Set(files));
      expect(songs[0]).not.toBe(previous);
      previous = songs.at(-1)!;
    }
  });
  it('handles an empty folder, one track and duplicate paths', () => {
    expect(new ShufflePlaylist([]).next()).toBeNull();
    const single = new ShufflePlaylist(['only.mp3', 'only.mp3', '']);
    expect(single.tracks).toEqual(['only.mp3']);
    expect([single.next(), single.next()]).toEqual(['only.mp3', 'only.mp3']);
  });
  it('fresh player instances get an independent shuffled cycle', () => {
    const first = new ShufflePlaylist(['a', 'b', 'c'], () => .99);
    expect([first.next(), first.next()]).toEqual(['a', 'b']);
    const reloaded = new ShufflePlaylist(['a', 'b', 'c'], () => 0);
    expect([reloaded.next(), reloaded.next(), reloaded.next()]).toEqual(['b', 'c', 'a']);
  });
});

const temporaryDirectories: string[] = [];
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    if (dirname(directory) !== resolve(tmpdir()) || !basename(directory).startsWith('ma3moora-audio-')) throw new Error('Unexpected test cleanup path');
    rmSync(directory, { recursive: true, force: true });
  }
});

function publicDirectory() {
  const root = mkdtempSync(join(tmpdir(), 'ma3moora-audio-'));
  temporaryDirectories.push(root);
  mkdirSync(join(root, 'assets/audio'), { recursive: true });
  return root;
}

describe('static folder discovery', () => {
  it('discovers direct audio files and safely encodes filenames', () => {
    const root = publicDirectory();
    for (const name of ['dance #1.MP3', 'second.ogg', 'README.md']) writeFileSync(join(root, 'assets/audio', name), 'test');
    mkdirSync(join(root, 'assets/audio/nested.mp3'));
    expect(discoverAmbientTracks(root, '/assets/audio')).toEqual(['/assets/audio/dance%20%231.MP3', '/assets/audio/second.ogg']);
  });
  it('leaves an empty or missing folder empty', () => {
    const root = publicDirectory();
    expect(discoverAmbientTracks(root, '/assets/audio')).toEqual([]);
    expect(discoverAmbientTracks(root, '/not-created')).toEqual([]);
  });
  it('rejects a configured folder outside the public directory', () => {
    expect(() => discoverAmbientTracks(publicDirectory(), '/../outside')).toThrow('inside public/');
  });
});
