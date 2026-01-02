import { describe, it, expect } from 'vitest';

import * as Main from '~lib/lint/main';
import STRUCTURE_CONFIG from '~structure.config.json';

describe('[Lint Main] defineConfig', () => {
  it('should create lint correctly without parameters', () => {
    const config = Main.createStructureLint();

    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });

  it('should create lint correctly with parameters', () => {
    const config = Main.createStructureLint(STRUCTURE_CONFIG);

    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });

  it('should create lint with specified moduleLayout', () => {
    const configFolder = Main.createStructureLint({
      ...STRUCTURE_CONFIG,
      moduleLayout: 'folder',
    });

    const configFlat = Main.createStructureLint({
      ...STRUCTURE_CONFIG,
      moduleLayout: 'flat',
    });

    expect(Array.isArray(configFolder)).toBe(true);
    expect(configFolder.length).toBeGreaterThan(0);

    expect(Array.isArray(configFlat)).toBe(true);
    expect(configFlat.length).toBeGreaterThan(0);
  });
});
