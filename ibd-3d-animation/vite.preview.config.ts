// Single-file build: everything (JS, CSS, images) inlined so the result can be
// hosted as one HTML file or published as a preview page.
import { defineConfig, mergeConfig } from 'vite';
import base from './vite.config';

export default mergeConfig(
  base,
  defineConfig({
    base: './',
    build: {
      outDir: 'dist-preview',
      cssCodeSplit: false,
      assetsInlineLimit: 100000000,
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  }),
);
