import { existsSync, readdirSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { normalizePath, type Plugin } from 'vite';

const virtualId = 'virtual:ambient-tracks';
const resolvedId = `\0${virtualId}`;
const audioFile = /\.(mp3|m4a|aac|ogg|oga|wav|webm|opus|flac)$/i;

export function ambientDirectory(publicDir: string, folder: string) {
  const root = resolve(publicDir);
  const directory = resolve(root, folder.replace(/^\/+/, ''));
  if (directory !== root && !directory.startsWith(root + sep)) throw new Error('The ambient audio folder must be inside public/.');
  return directory;
}

export function discoverAmbientTracks(publicDir: string, folder: string): string[] {
  const directory = ambientDirectory(publicDir, folder);
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile() && audioFile.test(entry.name))
    .map(entry => `${folder.replace(/\/$/, '')}/${encodeURIComponent(entry.name)}`)
    .sort();
}

/** Discover local tracks at build time, so the first tap can start playback synchronously. */
export function ambientAudioPlugin(folder: string): Plugin {
  let publicDir: string;
  return {
    name: 'ambient-audio-folder',
    configResolved(config) { publicDir = config.publicDir; },
    resolveId(id) { if (id === virtualId) return resolvedId; },
    load(id) {
      if (id === resolvedId) return `export default ${JSON.stringify(discoverAmbientTracks(publicDir, folder))};`;
    },
    configureServer(server) {
      const directory = ambientDirectory(publicDir, folder);
      server.watcher.add(directory);
      const refresh = (file: string) => {
        if (normalizePath(dirname(resolve(file))) !== normalizePath(directory) || !audioFile.test(file)) return;
        const module = server.moduleGraph.getModuleById(resolvedId);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload', path: '*' });
      };
      server.watcher.on('add', refresh).on('unlink', refresh);
      server.httpServer?.once('close', () => { server.watcher.off('add', refresh).off('unlink', refresh); });
    },
  };
}
