import { defineConfig } from 'rolldown';

export default defineConfig([
  {
    input: 'src/lint/index.ts',
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: 'index.js',
    },
    external: ['node:fs', 'node:path'],
  },
  {
    input: 'src/bin/main.ts',
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: 'bin.js',
    },
    external: ['node:crypto', 'node:fs', 'node:path', 'cacache', 'ora'],
  },
]);
