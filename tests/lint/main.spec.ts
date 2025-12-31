import { describe, it, expect } from 'vitest';

import * as Main from '~lib/lint/main';
import STRUCTURE_CONFIG from '~structure.config.json';

describe('[Lint Main] defineConfig', () => {
  it('should define config correctly without parameters', () => {
    const config = Main.createStructureLint();

    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });

  it('should define config correctly', () => {
    const config = Main.createStructureLint(STRUCTURE_CONFIG);

    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });
});
