import cacache from 'cacache';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi } from 'vitest';

import * as Utils from '~lib/bin/utils';
import STRUCTURE_CONFIG from '~structure.config.json';
import type { DefineOptions } from '~lib/lint/types';

describe('[Bin Utils] generateDocs', () => {
  const { dependencyFlow, docs } = STRUCTURE_CONFIG as Required<DefineOptions<string>>;
  const defaultDocs = fs.readFileSync(docs.file, 'utf-8');
  const prettier = path.resolve(process.cwd(), 'node_modules/.bin/prettier');

  it('should isCliEntry work correctly', () => {
    expect(Utils.isCliEntry('some/other/path')).toBe(false);
  });

  it('should generate docs correctly', async () => {
    await Utils.generateDocs({ dependencyFlow, docs, prettier });
    const cache = await cacache.get(Utils.CACHE_PATH, Utils.CACHE_KEY);
    const updatedDocs = fs.readFileSync(docs.file, 'utf-8');

    expect(updatedDocs).toBe(defaultDocs);
    expect(cache).toBeDefined();
  });

  it('should generate docs with the specified marker & content', async () => {
    await Utils.generateDocs({
      dependencyFlow,
      docs: { ...docs, markerTag: 'CUSTOM_MARKER', content: 'Custom Content' },
      prettier,
    });

    const updatedDocs = fs.readFileSync(docs.file, 'utf-8');

    expect(updatedDocs).toBe(defaultDocs);
    fs.writeFileSync(docs.file, defaultDocs);
  });

  it('should create cache when it does not exist', async () => {
    await cacache.rm(Utils.CACHE_PATH, Utils.CACHE_KEY);
    await Utils.generateDocs({ dependencyFlow, docs, prettier });

    const cache = await cacache.get(Utils.CACHE_PATH, Utils.CACHE_KEY);

    expect(cache).toBeDefined();
  });

  it('should throw error when doc file does not exist', async () => {
    await expect(
      Utils.generateDocs({
        dependencyFlow,
        docs: { ...docs, file: 'non-existent-file.md' },
        prettier,
      }),
    ).rejects.toThrow();
  });

  it('should throw error when the starter marker is missing', async () => {
    await expect(
      Utils.generateDocs({
        dependencyFlow,
        docs: { ...docs, markerTag: 'MISSING_MARKER' },
        prettier,
      }),
    ).rejects.toThrow();
  });

  it('should throw error when the end marker is missing', async () => {
    await expect(
      Utils.generateDocs({
        dependencyFlow,
        docs: { ...docs, markerTag: 'MISSINF_END_MARKER' },
        prettier,
      }),
    ).rejects.toThrow();
  });

  it('should skip formatting if Prettier is not found', async () => {
    await expect(
      Utils.generateDocs({
        dependencyFlow,
        docs,
        prettier: 'non-existent-prettier-path',
      }),
    ).resolves.toBeUndefined();
  });

  it('should skip formatting if Prettier fail', async () => {
    try {
      vi.resetModules();

      vi.doMock('node:child_process', () => ({
        execSync: vi.fn(() => {
          throw new Error('Formatting failed');
        }),
      }));

      const UtilsMocked = await import('~lib/bin/utils');

      await expect(
        UtilsMocked.generateDocs({ dependencyFlow, docs, prettier }),
      ).resolves.toBeUndefined();
    } finally {
      vi.doUnmock('node:child_process');
      vi.resetModules();

      fs.writeFileSync(docs.file, defaultDocs);
    }
  });
});
