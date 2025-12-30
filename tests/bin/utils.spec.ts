import cacache from 'cacache';
import fs from 'node:fs';
import { describe, it, expect, vi } from 'vitest';

import * as Utils from '../../src/bin/utils';
import STRUCTURE_CONFIG from '../../structure.config.json';
import type { DefineOptions } from '../../src/lint/types';

describe('[Bin Utils] generateDocs', () => {
  const { dependencyFlowchart, docs } = STRUCTURE_CONFIG as Required<
    DefineOptions<string>
  >;

  const defaultDocs = fs.readFileSync(docs.file, 'utf-8');

  it('should generate docs correctly', async () => {
    await Utils.generateDocs({ dependencyFlowchart, docs });
    const cache = await cacache.get(Utils.CACHE_PATH, Utils.CACHE_KEY);
    const updatedDocs = fs.readFileSync(docs.file, 'utf-8');

    expect(updatedDocs).toBe(defaultDocs);
    expect(cache).toBeDefined();
  });

  it('should generate docs with the specified marker & content', async () => {
    await Utils.generateDocs({
      dependencyFlowchart,
      docs: { ...docs, markerTag: 'CUSTOM_MARKER', content: 'Custom Content' },
    });

    const updatedDocs = fs.readFileSync(docs.file, 'utf-8');

    expect(updatedDocs).toBe(defaultDocs);
    fs.writeFileSync(docs.file, defaultDocs);
  });

  it('should create cache when it does not exist', async () => {
    await cacache.rm(Utils.CACHE_PATH, Utils.CACHE_KEY);
    await Utils.generateDocs({ dependencyFlowchart, docs });

    const cache = await cacache.get(Utils.CACHE_PATH, Utils.CACHE_KEY);

    expect(cache).toBeDefined();
  });

  it('should throw error when doc file does not exist', async () => {
    await expect(
      Utils.generateDocs({
        dependencyFlowchart,
        docs: { ...docs, file: 'non-existent-file.md' },
      }),
    ).rejects.toThrow();
  });

  it('should throw error when the starter marker is missing', async () => {
    await expect(
      Utils.generateDocs({
        dependencyFlowchart,
        docs: { ...docs, markerTag: 'MISSING_MARKER' },
      }),
    ).rejects.toThrow();
  });

  it('should throw error when the end marker is missing', async () => {
    await expect(
      Utils.generateDocs({
        dependencyFlowchart,
        docs: { ...docs, markerTag: 'MISSINF_END_MARKER' },
      }),
    ).rejects.toThrow();
  });

  it('should skip formatting if Prettier or ESLint fail', async () => {
    try {
      vi.resetModules();

      // 2) 只對「接下來才會 import 的模組」生效的 mock（不會回頭改到上面已經 import 的 Utils）
      vi.doMock('node:child_process', () => ({
        execSync: vi.fn(() => {
          throw new Error('Formatting failed');
        }),
      }));

      // 3) 用動態 import 取得「吃到 mock 的」utils 新實例
      const UtilsMocked = await import('../../src/bin/utils');

      // 4) async 要用 resolves/rejects，不要用 not.toThrow()
      await expect(
        UtilsMocked.generateDocs({ dependencyFlowchart, docs }),
      ).resolves.toBeUndefined();
    } finally {
      // 6) 收尾，避免 mock 狀態殘留（雖然你放最後也建議做）
      vi.doUnmock('node:child_process');
      vi.resetModules();

      // 保險：如果 generateDocs 途中有動到檔案內容，回復原狀
      fs.writeFileSync(docs.file, defaultDocs);
    }
  });
});
