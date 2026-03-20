import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './src/main.js',
      name: 'WPRRT',
      formats: ['iife'],
      // Output as assets/app.js — matches what WordPress already enqueues
      fileName: () => 'app.js',
    },
    outDir: 'assets',
    emptyOutDir: false, // don't wipe style.css or screenshots
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // No content-hash in filename
        assetFileNames: '[name][extname]',
      },
    },
    minify: false, // keep readable during development; switch to true for release
    sourcemap: false,
  },
});
