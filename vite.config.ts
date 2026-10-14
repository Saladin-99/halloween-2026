import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { siteContent } from './src/config/siteContent';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);

export default defineConfig({
  base: './',
  plugins: [react(), {
    name: 'invitation-metadata',
    transformIndexHtml: html => html.replace('%SITE_TITLE%', escapeHtml(siteContent.identity.documentTitle)).replace('%SITE_DESCRIPTION%', escapeHtml(siteContent.identity.description)),
  }],
  // The lazy 3D bundle is ~151 KB gzip; raw Three.js size exceeds Vite's 500 KB notice.
  build: { target: 'es2022', chunkSizeWarningLimit: 650 },
  test: { include: ['tests/**/*.test.ts'] },
});
