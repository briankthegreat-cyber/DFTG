import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        embed: path.resolve(__dirname, 'embed.html'),
      },
    },
  },
  server: { port: 5174 },
  preview: { port: 4174 },
});
