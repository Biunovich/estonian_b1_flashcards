import path from 'node:path';
import { createRequire } from 'node:module';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);
const solidPluginPath = require.resolve('vite-plugin-solid');
const solidPackagePath = require.resolve('solid-js/package.json');
const solidWebPath = require.resolve('solid-js/web');
const solid = (await import(solidPluginPath)).default;

export default defineConfig({
  base: '/estonian_b1_flashcards/',
  plugins: [solid()],
  resolve: {
    alias: {
      'solid-js/web': solidWebPath,
      'solid-js': path.dirname(solidPackagePath),
    },
  },
  build: {
    target: 'esnext',
  },
});
