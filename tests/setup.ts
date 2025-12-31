import { vi } from 'vitest';

vi.mock('ora', () => {
  return {
    default: () => ({
      start: () => ({
        succeed: vi.fn(),
        fail: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        stop: vi.fn(),
        stopAndPersist: vi.fn(),
        text: '',
      }),
    }),
  };
});
