import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['app/**/*.ts', 'bin/**/*.ts', 'config/**/*.ts', 'start/**/*.ts'],
  ignoreWatch: ['node_modules'],
  outDir: 'build',
});
