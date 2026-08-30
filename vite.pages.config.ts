import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import {resolve} from 'node:path';

// Separate, reversible production build. The original Vinext/D1 entry stays intact.
export default defineConfig({
  root: resolve('pages-web'),
  publicDir: resolve('public'),
  envDir: resolve('.'),
  envPrefix: 'PUBLIC_',
  plugins: [react()],
  css: {postcss: {plugins: [tailwindcss()]}},
  resolve: {alias: {'next/link': resolve('pages-web/link.tsx')}},
  build: {outDir: resolve('dist-pages'), emptyOutDir: true, sourcemap: false},
});
