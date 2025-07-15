import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  clean: true,
  format: ['cjs', 'esm', 'iife'],
  globalName: 'StarterLibTs',
  dts: true,
  minify: true,
  external: ['ohm-js'],
  noExternal: ['ptw'],
});
