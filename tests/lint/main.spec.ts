import { describe, it, expect } from 'vitest';

import * as Main from '~lib/lint/main';
import STRUCTURE_CONFIG from '~structure.config.json';
import type { DefineOptions } from '~lib/lint/types';

describe('[Lint Main] defineConfig', () => {
  it('should define config correctly without parameters', () => {
    const config = Main.defineConfig();

    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });

  it('should define config correctly', () => {
    const config = Main.defineConfig(STRUCTURE_CONFIG as DefineOptions<string>);

    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });
});
