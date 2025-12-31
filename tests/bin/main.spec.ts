import { describe, it, expect, vi } from 'vitest';

const TIMEOUT = 60 * 1000;

describe('main.ts executes on import', () => {
  it(
    'should execute correctly',
    async () => {
      await expect(import('~lib/bin/main')).resolves.toBeDefined();
    },
    TIMEOUT,
  );

  it(
    'should stop execution when the structure config is missing',
    async () => {
      try {
        vi.resetModules();

        vi.doMock('~lib/lint/utils', () => ({
          loadStructureConfig: vi.fn(() => {
            throw new Error('structure.config.json not found');
          }),
        }));

        await expect(import('~lib/bin/main')).resolves.toBeDefined();
      } finally {
        vi.doUnmock('~lib/lint/utils');
        vi.resetModules();
      }
    },
    TIMEOUT,
  );

  it(
    'should stop execution when generateDocs fails',
    async () => {
      try {
        vi.resetModules();

        vi.doMock('~lib/bin/utils', () => ({
          generateDocs: vi.fn(() => Promise.reject(new Error('Failed to generate docs'))),
        }));

        await expect(import('~lib/bin/main')).resolves.toBeDefined();
      } finally {
        vi.doUnmock('~lib/bin/utils');
        vi.resetModules();
      }
    },
    TIMEOUT,
  );
});
