import { describe, it, expect, vi } from 'vitest';

import { run } from '~lib/bin/main';

describe('main.ts executes on import', () => {
  it('should CLI work correctly', async () => {
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(((code?: number) => code) as never);

    try {
      vi.resetModules();
      vi.doMock('~lib/bin/utils', () => ({ isCliEntry: vi.fn(() => true) }));

      await expect(import('~lib/bin/main')).resolves.toBeDefined();
    } finally {
      vi.doUnmock('~lib/lint/utils');
      vi.resetModules();
      exitSpy.mockRestore();
    }
  });

  it('should run function work correctly', async () => {
    expect(await run()).toBe(0);
  });

  it('should stop execution when no docs config', async () => {
    try {
      vi.resetModules();
      vi.doMock('~lib/bin/utils', () => ({ isCliEntry: vi.fn(() => false) }));

      vi.doMock('~lib/lint/utils', () => ({
        loadStructureConfig: vi.fn(() => ({})),
      }));

      const MainMocked = await import('~lib/bin/main');

      expect(await MainMocked.run()).toBe(0);
    } finally {
      vi.doUnmock('~lib/bin/utils');
      vi.doUnmock('~lib/lint/utils');
      vi.resetModules();
    }
  });

  it('should stop execution when the structure config is missing', async () => {
    try {
      vi.resetModules();
      vi.doMock('~lib/bin/utils', () => ({ isCliEntry: vi.fn(() => false) }));

      vi.doMock('~lib/lint/utils', () => ({
        loadStructureConfig: vi.fn(() => {
          throw new Error('structure.config.json not found');
        }),
      }));

      const MainMocked = await import('~lib/bin/main');

      expect(await MainMocked.run()).toBe(1);
    } finally {
      vi.doUnmock('~lib/bin/utils');
      vi.doUnmock('~lib/lint/utils');
      vi.resetModules();
    }
  });
});
