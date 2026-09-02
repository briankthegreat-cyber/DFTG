// Single-file build used for shareable previews (everything inlined into one HTML file).
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
      rollupOptions: { output: { inlineDynamicImports: true } }
    }
  })
);
