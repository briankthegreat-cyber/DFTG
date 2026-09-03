// Single-file builds: everything inlined into one HTML file.
//   PREVIEW_ENTRY=embed  -> the explainer alone (becomes embed/index.html)
//   PREVIEW_ENTRY=site   -> the whole website with the hash router (shareable preview)
import { defineConfig, mergeConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import base from './vite.config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entry = process.env.PREVIEW_ENTRY === 'site' ? 'index.html' : 'embed.html';

export default mergeConfig(
  base,
  defineConfig({
    base: './',
    build: {
      outDir: 'dist-preview',
      emptyOutDir: true,
      cssCodeSplit: false,
      assetsInlineLimit: 100000000,
      rollupOptions: { input: path.resolve(__dirname, entry), output: { inlineDynamicImports: true } },
    },
  }),
);
