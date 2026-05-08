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

  it('should use flat-mode same-layer error message when moduleLayout is flat', () => {
    const config = Main.createStructureLint({
      ...STRUCTURE_CONFIG,
      moduleLayout: 'flat',
    });

    const folderConfig = config.find((c) => 'rules' in c);

    const rule = (folderConfig as { rules: Record<string, unknown> })?.rules?.[
      'no-restricted-imports'
    ] as [string, { patterns: { message: string; group: string[] }[] }];

    // Same-layer pattern: group contains appAlias/folder/** and message is flat-specific
    const sameLayerPattern = rule?.[1]?.patterns?.find(
      (p) => p.group?.some((g) => g.includes('/**')) && p.message?.includes('./X'),
    );

    expect(sameLayerPattern).toBeDefined();
    expect(sameLayerPattern?.message).toContain('./X');
  });

  it('should use default same-layer error message when moduleLayout is folder', () => {
    const config = Main.createStructureLint({
      ...STRUCTURE_CONFIG,
      moduleLayout: 'folder',
    });

    const folderConfig = config.find((c) => 'rules' in c);

    const rule = (folderConfig as { rules: Record<string, unknown> })?.rules?.[
      'no-restricted-imports'
    ] as [string, { patterns: { message: string; group: string[] }[] }];

    const sameLayerPattern = rule?.[1]?.patterns?.find(
      (p) => p.group?.some((g) => g.includes('/**')) && p.message?.includes('same layer'),
    );

    expect(sameLayerPattern).toBeDefined();
  });

  it('should prepend global ignores config when lintFilesIgnore is set', () => {
    const config = Main.createStructureLint({
      ...STRUCTURE_CONFIG,
      lintFilesIgnore: ['**/*.test.ts', '**/*.spec.ts'],
    });

    const first = config[0] as { ignores?: string[] };

    expect(first.ignores).toEqual(['**/*.test.ts', '**/*.spec.ts']);
  });

  it('should accept lintFilesIgnore as a single string', () => {
    const config = Main.createStructureLint({
      ...STRUCTURE_CONFIG,
      lintFilesIgnore: '**/*.test.ts',
    });

    const first = config[0] as { ignores?: string[] };

    expect(first.ignores).toEqual(['**/*.test.ts']);
  });

  it('should apply severity to all generated no-restricted-imports rules', () => {
    const config = Main.createStructureLint({
      ...STRUCTURE_CONFIG,
      severity: 'warn',
    });

    const folderConfigs = config.filter((c) => 'rules' in c) as {
      rules: Record<string, [string, unknown]>;
    }[];

    for (const c of folderConfigs) {
      expect(c.rules['no-restricted-imports'][0]).toBe('warn');
    }
  });

  it('should default severity to error', () => {
    const config = Main.createStructureLint(STRUCTURE_CONFIG);

    const folderConfig = config.find((c) => 'rules' in c) as {
      rules: Record<string, [string, unknown]>;
    };

    expect(folderConfig?.rules['no-restricted-imports'][0]).toBe('error');
  });

  it('should add same-layer restrictions for additionalAliases', () => {
    const config = Main.createStructureLint({
      ...STRUCTURE_CONFIG,
      additionalAliases: { '~src': 'src' },
    });

    const folderConfig = config.find((c) => 'rules' in c) as {
      rules: Record<string, [string, { patterns: { group: string[] }[] }]>;
    };

    const patterns = folderConfig?.rules?.['no-restricted-imports']?.[1]?.patterns ?? [];
    const sameLayerGroups = patterns.flatMap((p) => p.group ?? []);

    expect(sameLayerGroups.some((g) => g.startsWith('~src/'))).toBe(true);
  });

  it('should use patterns (glob) for package rules with pattern:true', () => {
    const config = Main.createStructureLint({
      ...STRUCTURE_CONFIG,
      packageImportRules: [
        {
          name: '@/services/auth/**',
          allowedInFolders: ['services'],
          pattern: true,
        },
      ],
    });

    const folderConfig = config.find(
      (c) =>
        'rules' in c &&
        (c as { files: string[] }).files?.some((f) => f.includes('components')),
    ) as { rules: Record<string, [string, { patterns?: unknown[]; paths?: unknown[] }]> };

    const rule = folderConfig?.rules?.['no-restricted-imports']?.[1];

    expect(rule?.patterns?.some((p) => (p as { group: string[] }).group?.[0] === '@/services/auth/**')).toBe(true);
    expect(rule?.paths).toBeUndefined();
  });

  it('should use paths (literal) for package rules without pattern flag', () => {
    const config = Main.createStructureLint({
      ...STRUCTURE_CONFIG,
      packageImportRules: [
        {
          name: 'axios',
          allowedInFolders: ['services'],
        },
      ],
    });

    const folderConfig = config.find(
      (c) =>
        'rules' in c &&
        (c as { files: string[] }).files?.some((f) => f.includes('components')),
    ) as { rules: Record<string, [string, { paths?: unknown[] }]> };

    const paths = folderConfig?.rules?.['no-restricted-imports']?.[1]?.paths ?? [];

    expect(paths.some((p) => (p as { name: string }).name === 'axios')).toBe(true);
  });

  it('should generate two configs per folder when exemptFilePatterns is set', () => {
    const baseConfig = Main.createStructureLint(STRUCTURE_CONFIG);

    const exemptConfig = Main.createStructureLint({
      ...STRUCTURE_CONFIG,
      packageImportRules: [
        {
          name: 'vue',
          importNames: ['provide'],
          allowedInFolders: ['contexts'],
          exemptFilePatterns: ['**/*.test.vue'],
        },
      ],
    });

    // The exempt version generates 2 configs per folder (base + ignores version)
    // whereas the base generates 1 per folder
    expect(exemptConfig.length).toBeGreaterThan(baseConfig.length);
  });

  it('should handle config without packageImportRules (no paths restrictions)', () => {
    const { packageImportRules: _, ...configWithoutPkg } = STRUCTURE_CONFIG;

    const config = Main.createStructureLint(configWithoutPkg);

    const folderConfig = config.find((c) => 'rules' in c) as {
      rules: Record<string, [string, { paths?: unknown[] }]>;
    };

    expect(folderConfig?.rules?.['no-restricted-imports']?.[1]?.paths).toBeUndefined();
  });

  it('should handle pattern:true rule with importNames (glob rule with named imports)', () => {
    const config = Main.createStructureLint({
      ...STRUCTURE_CONFIG,
      packageImportRules: [
        {
          name: '@/services/**',
          importNames: ['httpClient'],
          allowedInFolders: ['services'],
          pattern: true,
        },
      ],
    });

    const folderConfig = config.find(
      (c) =>
        'rules' in c &&
        (c as { files: string[] }).files?.some((f) => f.includes('components')),
    ) as { rules: Record<string, [string, { patterns?: unknown[] }]> };

    const globEntry = folderConfig?.rules?.['no-restricted-imports']?.[1]?.patterns?.find(
      (p) => (p as { group: string[] }).group?.[0] === '@/services/**',
    ) as { importNames?: string[]; message: string } | undefined;

    expect(globEntry).toBeDefined();
    expect(globEntry?.importNames).toEqual(['httpClient']);
    expect(globEntry?.message).toContain('httpClient');
  });

  it('should handle mixed exempt and non-exempt package rules', () => {
    const config = Main.createStructureLint({
      ...STRUCTURE_CONFIG,
      packageImportRules: [
        {
          name: 'vue',
          importNames: ['provide'],
          allowedInFolders: ['contexts'],
          exemptFilePatterns: ['**/*.test.vue'],
        },
        {
          name: 'axios',
          allowedInFolders: ['services'],
          // no exemptFilePatterns
        },
      ],
    });

    // The config with ignores should include only the exempt rule's patterns
    const configsWithIgnores = (config as { files: string[]; ignores?: string[] }[]).filter(
      (c) => c.ignores?.length,
    );

    expect(configsWithIgnores.length).toBeGreaterThan(0);
    expect(configsWithIgnores[0].ignores).toContain('**/*.test.vue');
  });

  it('should generate no-restricted-syntax for selfOnly re-export prevention', () => {
    const config = Main.createStructureLint({
      appAlias: '~app',
      lintFiles: 'src/{folder}/**/*.ts',
      dependencyFlow: [
        ['components', 'hooks'],
        ['hooks', 'contexts', { selfOnly: true }],
      ],
    });

    const hooksConfig = config.find(
      (c) => 'rules' in c && (c as { files: string[] }).files?.some((f) => f.includes('hooks')),
    ) as { rules: Record<string, [string, ...{ selector: string; message: string }[]]> } | undefined;

    const syntaxRule = hooksConfig?.rules?.['no-restricted-syntax'];

    expect(syntaxRule).toBeDefined();
    expect(syntaxRule?.[0]).toBe('error');
    expect(syntaxRule?.[1]?.selector).toContain('ExportNamedDeclaration');
    expect(syntaxRule?.[1]?.selector).toContain('ExportAllDeclaration');
    expect(syntaxRule?.[1]?.selector).toContain('contexts');
  });

  it('should not generate no-restricted-syntax when no selfOnly edges exist', () => {
    const config = Main.createStructureLint({
      appAlias: '~app',
      lintFiles: 'src/{folder}/**/*.ts',
      dependencyFlow: [
        ['pages', 'components'],
        ['components', 'hooks'],
      ],
    });

    const folderConfigs = config.filter((c) => 'rules' in c) as {
      rules: Record<string, unknown>;
    }[];

    for (const c of folderConfigs) {
      expect(c.rules['no-restricted-syntax']).toBeUndefined();
    }
  });

  it('should include ignores on the second config for folders with exemptFilePatterns', () => {
    const config = Main.createStructureLint({
      ...STRUCTURE_CONFIG,
      packageImportRules: [
        {
          name: 'vue',
          importNames: ['provide'],
          allowedInFolders: ['contexts'],
          exemptFilePatterns: ['**/*.test.vue'],
        },
      ],
    });

    const folderConfigs = config.filter((c) => 'rules' in c) as {
      files: string[];
      ignores?: string[];
      rules: Record<string, unknown>;
    }[];

    const configsWithIgnores = folderConfigs.filter((c) => c.ignores?.length);

    expect(configsWithIgnores.length).toBeGreaterThan(0);
    expect(configsWithIgnores[0].ignores).toContain('**/*.test.vue');
  });
});
