import { describe, it, expect } from 'vitest';
import type { JsonObject, JsonValue } from 'type-fest';

import * as Utils from '../../src/lint/utils';
import STRUCTURE_CONFIG from '../../structure.config.json';
import type { DefineOptions, FlowchartConfig } from '../../src/lint/types';

const CONFIG = STRUCTURE_CONFIG as Partial<
  Record<keyof DefineOptions<string>, JsonValue>
>;

describe('[Lint Utils] extractAllFolders', () => {
  it('should extract all folders from dependency flowchart', () => {
    const folders = Utils.extractAllFolders([
      ['components', 'containers'],
      ['containers', 'pages'],
      ['contexts', 'hooks'],
    ]);

    expect(folders.sort()).toEqual([
      'components',
      'containers',
      'contexts',
      'hooks',
      'pages',
    ]);
  });
});

describe('[Lint Utils] getDisableFolderImports', () => {
  it('should get disabled folder imports correctly (components)', () => {
    const folders = Utils.getDisableFolderImports(FLOWCHART, FOLDERS, 'components');

    expect(folders.sort()).toEqual([
      'containers',
      'contexts',
      'layouts',
      'pages',
      'services',
    ]);
  });

  it('should get disabled folder imports correctly (containers)', () => {
    const folders = Utils.getDisableFolderImports(FLOWCHART, FOLDERS, 'containers');

    expect(folders.sort()).toEqual(['layouts', 'pages']);
  });

  it('should get disabled folder imports correctly (contexts)', () => {
    const folders = Utils.getDisableFolderImports(FLOWCHART, FOLDERS, 'contexts');

    expect(folders.sort()).toEqual([
      'components',
      'containers',
      'hooks',
      'icons',
      'layouts',
      'pages',
      'styles',
    ]);
  });

  it('should get disabled folder imports correctly (hooks)', () => {
    const folders = Utils.getDisableFolderImports(FLOWCHART, FOLDERS, 'hooks');

    expect(folders.sort()).toEqual([
      'components',
      'containers',
      'icons',
      'layouts',
      'pages',
      'styles',
    ]);
  });

  it('should get disabled folder imports correctly (icons)', () => {
    const folders = Utils.getDisableFolderImports(FLOWCHART, FOLDERS, 'icons');

    expect(folders.sort()).toEqual([
      'components',
      'containers',
      'contexts',
      'hooks',
      'layouts',
      'pages',
      'services',
    ]);
  });

  it('should get disabled folder imports correctly (styles)', () => {
    const folders = Utils.getDisableFolderImports(FLOWCHART, FOLDERS, 'styles');

    expect(folders.sort()).toEqual([
      'components',
      'containers',
      'contexts',
      'hooks',
      'icons',
      'layouts',
      'pages',
      'services',
    ]);
  });

  it('should get disabled folder imports correctly (services)', () => {
    const folders = Utils.getDisableFolderImports(FLOWCHART, FOLDERS, 'services');

    expect(folders.sort()).toEqual([
      'components',
      'containers',
      'contexts',
      'hooks',
      'icons',
      'layouts',
      'pages',
      'styles',
    ]);
  });

  it('should get disabled folder imports correctly (pages)', () => {
    const folders = Utils.getDisableFolderImports(FLOWCHART, FOLDERS, 'pages');

    expect(folders.sort()).toEqual([]);
  });

  it('should get disabled folder imports correctly (utils)', () => {
    const folders = Utils.getDisableFolderImports(FLOWCHART, FOLDERS, 'utils');

    expect(folders.sort()).toEqual([
      'components',
      'containers',
      'contexts',
      'hooks',
      'icons',
      'layouts',
      'pages',
      'services',
      'styles',
    ]);
  });

  const FLOWCHART: FlowchartConfig<string>[] = [
    ['pages', 'layouts'],
    ['layouts', 'containers'],
    [
      'containers',
      'contexts',
      {
        label: 'Only Provider',
      },
    ],
    ['containers', 'components'],
    ['components', 'hooks'],
    [
      'hooks',
      'contexts',
      {
        label: 'Only Context',
        selfOnly: true,
      },
    ],
    ['contexts', 'services'],
    ['components', 'icons'],
    ['icons', 'styles'],
    ['styles', 'utils'],
    ['services', 'utils'],
  ];

  const FOLDERS = Utils.extractAllFolders(FLOWCHART);
});

describe('[Lint Utils] getLintFiles', () => {
  it('should get lint files correctly', () => {
    const files = Utils.getLintFiles('components', [
      'src/{folder}/**/*.ts',
      'src/{folder}/**/*.tsx',
    ]);

    expect(files).toEqual(['src/components/**/*.ts', 'src/components/**/*.tsx']);
  });

  it('should get lint files correctly when a single string is provided', () => {
    const files = Utils.getLintFiles('services', 'src/{folder}/**/*.(ts|tsx)');

    expect(files).toEqual(['src/services/**/*.(ts|tsx)']);
  });
});

describe('[Lint Utils] loadStructureConfig', () => {
  it('should throw error when structure.config.json is missing', () => {
    expect(() => Utils.loadStructureConfig('non-existent.config.json')).toThrow();
  });

  it('should load and validate structure.config.json correctly', () => {
    const config = Utils.loadStructureConfig('structure.config.json');

    expect(config).toEqual(CONFIG);
  });

  it('should load and validate structure.config.json correctly', () => {
    const config = Utils.loadStructureConfig();

    expect(config).toEqual(CONFIG);
  });
});

describe('[Lint Utils] isConfigValid', () => {
  it('should validate a correct structure config', () => {
    const { docs, overrideRules, packageImportRules, ...config } = CONFIG;

    expect(() => Utils.isConfigValid(CONFIG)).not.toThrow();
    expect(() => Utils.isConfigValid({ ...config, docs })).not.toThrow();
    expect(() => Utils.isConfigValid({ ...config, overrideRules })).not.toThrow();
    expect(() => Utils.isConfigValid({ ...config, packageImportRules })).not.toThrow();
  });

  it('should throw error for invalid appAlias', () => {
    const { appAlias: _, ...config } = CONFIG;

    expect(() => Utils.isConfigValid(config)).toThrow();
    expect(() => Utils.isConfigValid({ ...config, appAlias: 123 })).toThrow();
    expect(() => Utils.isConfigValid({ ...config, appAlias: ' ' })).toThrow();
  });

  it('should throw error for invalid dependencyFlowchart', () => {
    const { dependencyFlowchart: _, ...config } = CONFIG;

    expect(() => Utils.isConfigValid(config)).toThrow();

    expect(() =>
      Utils.isConfigValid({ ...config, dependencyFlowchart: 'not-an-array' }),
    ).toThrow();

    expect(() =>
      Utils.isConfigValid({ ...config, dependencyFlowchart: [123] }),
    ).toThrow();

    expect(() =>
      Utils.isConfigValid({ ...config, dependencyFlowchart: [[123]] }),
    ).toThrow();

    expect(() =>
      Utils.isConfigValid({ ...config, dependencyFlowchart: [['valid', 123]] }),
    ).toThrow();

    expect(() =>
      Utils.isConfigValid({ ...config, dependencyFlowchart: [[' ', 'valid']] }),
    ).toThrow();

    expect(() =>
      Utils.isConfigValid({ ...config, dependencyFlowchart: [['valid', ' ']] }),
    ).toThrow();

    expect(() =>
      Utils.isConfigValid({
        ...config,
        dependencyFlowchart: [['valid', 'valid', 'not-an-object']],
      }),
    ).toThrow();
  });

  it('should throw error for invalid docs', () => {
    const { docs, ...config } = CONFIG;

    expect(() => Utils.isConfigValid({ ...config, docs: {} })).toThrow();
    expect(() => Utils.isConfigValid({ ...config, docs: { file: 1 } })).toThrow();
    expect(() => Utils.isConfigValid({ ...config, docs: { file: ' ' } })).toThrow();

    expect(() =>
      Utils.isConfigValid({ ...config, docs: { file: 'valid', markerTag: 1 } }),
    ).toThrow();

    expect(() =>
      Utils.isConfigValid({ ...config, docs: { file: 'valid', markerTag: ' ' } }),
    ).toThrow();

    expect(() =>
      Utils.isConfigValid({ ...config, docs: { ...(docs as JsonObject), content: 123 } }),
    ).toThrow();
  });

  it('should throw error for invalid overrideRules', () => {
    const { overrideRules: _, ...config } = CONFIG;

    expect(() =>
      Utils.isConfigValid({ ...config, overrideRules: { invalidFolder: {} } }),
    ).toThrow();

    expect(() =>
      Utils.isConfigValid({ ...config, overrideRules: { components: 'not-an-object' } }),
    ).toThrow();
  });

  it('should throw error for invalid packageImportRules', () => {
    const { packageImportRules: _, ...config } = CONFIG;

    expect(() =>
      Utils.isConfigValid({ ...config, packageImportRules: 'not-an-array' }),
    ).toThrow();

    expect(() =>
      Utils.isConfigValid({ ...config, packageImportRules: [null] }),
    ).toThrow();

    expect(() =>
      Utils.isConfigValid({ ...config, packageImportRules: [{ name: 1 }] }),
    ).toThrow();

    expect(() =>
      Utils.isConfigValid({ ...config, packageImportRules: [{ name: ' ' }] }),
    ).toThrow();

    expect(() =>
      Utils.isConfigValid({
        ...config,
        packageImportRules: [{ name: 'react', importNames: [1] }],
      }),
    ).toThrow();

    expect(() =>
      Utils.isConfigValid({
        ...config,
        packageImportRules: [{ name: 'react', importNames: [' '] }],
      }),
    ).toThrow();

    expect(() =>
      Utils.isConfigValid({
        ...config,
        packageImportRules: [{ name: 'react', allowedInFolders: 'not-an-array' }],
      }),
    ).toThrow();

    expect(() =>
      Utils.isConfigValid({
        ...config,
        packageImportRules: [{ name: 'react', allowedInFolders: [] }],
      }),
    ).toThrow();

    expect(() =>
      Utils.isConfigValid({
        ...config,
        packageImportRules: [{ name: 'react', allowedInFolders: ['invalidFolder'] }],
      }),
    ).toThrow();
  });

  it('should throw error for invalid lintFiles', () => {
    const { lintFiles: _, ...config } = CONFIG;

    expect(() => Utils.isConfigValid({ ...config, lintFiles: [] })).toThrow();
    expect(() => Utils.isConfigValid({ ...config, lintFiles: 123 })).toThrow();
    expect(() => Utils.isConfigValid({ ...config, lintFiles: [123] })).toThrow();
    expect(() => Utils.isConfigValid({ ...config, lintFiles: [''] })).toThrow();

    expect(() => Utils.isConfigValid({ ...config, lintFiles: 'src/**/*.ts' })).toThrow();

    expect(() =>
      Utils.isConfigValid({ ...config, lintFiles: ['src/**/*.ts', '{folder}/**/*.ts'] }),
    ).toThrow();
  });
});
