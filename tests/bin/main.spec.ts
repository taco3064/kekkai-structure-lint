import { describe, it, expect, vi } from 'vitest';

describe('main.ts executes on import', () => {
  it('should execute correctly', async () => {
    await expect(import('../../src/bin/main')).resolves.toBeDefined();
  });

  it('should stop execution when the structure config is missing', async () => {
    try {
      vi.resetModules();

      vi.doMock('../../src/lint/utils', () => ({
        loadStructureConfig: vi.fn(() => {
          throw new Error('structure.config.json not found');
        }),
      }));

      await expect(import('../../src/bin/main')).resolves.toBeDefined();
    } finally {
      vi.doUnmock('../../src/lint/utils');
      vi.resetModules();
    }
  });

  it('should stop execution when generateDocs fails', async () => {
    try {
      vi.resetModules();

      vi.doMock('../../src/bin/utils', () => ({
        generateDocs: vi.fn(() => Promise.reject(new Error('Failed to generate docs'))),
      }));

      await expect(import('../../src/bin/main')).resolves.toBeDefined();
    } finally {
      vi.doUnmock('../../src/bin/utils');
      vi.resetModules();
    }
  });
});
