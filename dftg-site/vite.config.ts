import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Single-file previews inline everything, which is incompatible with manual chunking.
const singleFile = Boolean(process.env.PREVIEW_ENTRY);

function manualChunks(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;
  if (/[\\/](three|@react-three|postprocessing|maath|its-fine|zustand|suspend-react|react-reconciler)[\\/]/.test(id)) return 'vendor-three';
  if (/[\\/](gsap|@gsap|motion|motion-dom|motion-utils|framer-motion)[\\/]/.test(id)) return 'vendor-motion';
  if (/[\\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run)[\\/]/.test(id)) return 'vendor-react';
  return undefined;
}

// VITE_BASE lets the GitHub Pages workflow build for a sub-path such as /DFTG/.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom', 'three'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@react-bits': path.resolve(__dirname, 'src/react-bits'),
    },
  },
  build: {
    sourcemap: false,
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        embed: path.resolve(__dirname, 'embed.html'),
      },
      output: singleFile ? {} : { manualChunks },
    },
  },
  server: { port: 5174 },
  preview: { port: 4174 },
});
