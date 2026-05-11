import { glob } from 'glob';
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'application/**/*.ts',
    'bin/**/*.ts',
    'config/**/*.ts',
    'database/**/*.ts',
    'start/**/*.ts',
    'extensions/**/*.ts',
    'hooks/**/*.ts',
  ],
  ignoreWatch: ['node_modules'],
  outDir: 'build',
  target: 'es2024',
  format: ['esm'],
  async onSuccess(): Promise<void> {
    const patterns: Array<{ pattern: string; label: string }> = [
      { pattern: 'extensions/**/manifest.json', label: 'manifest.json' },
      { pattern: 'templates/**/*.ejs', label: 'template.ejs' },
    ];

    for (const { pattern, label } of patterns) {
      const matches = await glob(pattern);
      for (const src of matches) {
        const dst = join('build', src);
        await mkdir(dirname(dst), { recursive: true });
        await copyFile(src, dst);
      }
      console.info(
        `[tsup:onSuccess] copied ${matches.length} ${label} -> build/`,
      );
    }
  },
});
