import fs from 'node:fs';
import path from 'node:path';

import type { DefineOptions, FlowchartConfig } from './types';

export function extractAllFolders<F extends string>(
  dependencyFlowchart: FlowchartConfig<F>[],
): F[] {
  return Array.from(new Set<F>(dependencyFlowchart.flatMap(([from, to]) => [from, to])));
}

export function getDisableFolderImports<F extends string>(
  config: FlowchartConfig<F>[],
  folders: Readonly<F[]>,
  folder: F,
): F[] {
  const allowedFolders = (function getAllowedFolders(
    config: FlowchartConfig<F>[],
    folder: F,
    root: boolean,
  ) {
    return config.reduce<F[]>((acc, [from, to, options]) => {
      if (from === folder) {
        if (!options?.selfOnly) {
          acc.push(to, ...getAllowedFolders(config, to, false));
        } else if (root) {
          acc.push(to);
        }
      }

      return acc;
    }, []);
  })(config, folder, true);

  return folders.filter((f) => !allowedFolders.includes(f) && f !== folder);
}

export function loadStructureConfig<F extends string>() {
  const configPath = path.resolve(process.cwd(), 'structure.config.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(`structure.config.json not found at ${configPath}`);
  }

  return isConfigValid<F>(JSON.parse(fs.readFileSync(configPath, 'utf-8')));
}

function isConfigValid<F extends string>({
  appAlias,
  dependencyFlowchart,
  docs,
  overrideRules,
  packageImportRules,
  getLintFiles,
}: Partial<DefineOptions<F>>) {
  if (!appAlias?.trim()) {
    throw new Error('appAlias is required in structure.config.json');
  }

  if (!Array.isArray(dependencyFlowchart)) {
    throw new Error('dependencyFlowchart must be an array in structure.config.json');
  } else {
    for (const item of dependencyFlowchart) {
      if (!Array.isArray(item)) {
        throw new Error(
          'Each item in dependencyFlowchart must be a tuple [string, string, options?] in structure.config.json',
        );
      } else if (!item[0]?.trim() || !item[1]?.trim()) {
        throw new Error(
          'Each tuple in dependencyFlowchart must have non-empty string values for the first two elements in structure.config.json',
        );
      } else if (item.length > 2 && typeof item[2] !== 'object') {
        throw new Error(
          'The third element in the dependencyFlowchart tuple must be an object if provided in structure.config.json',
        );
      }
    }
  }

  const folders = extractAllFolders(dependencyFlowchart);

  if (docs && (!docs.file?.trim() || !docs.markerTag?.trim())) {
    throw new Error(
      'docs.file and docs.markerTag are required in structure.config.json if docs is provided',
    );
  } else if (docs?.content && typeof docs.content !== 'string') {
    throw new Error('docs.content must be a string in structure.config.json');
  }

  if (overrideRules) {
    const entries = Object.entries(overrideRules);

    if (entries.some(([key]) => !folders.includes(key as F))) {
      throw new Error(
        'overrideRules contains invalid folder keys not present in dependencyFlowchart in structure.config.json',
      );
    } else if (entries.some(([_, rules]) => rules && typeof rules !== 'object')) {
      throw new Error('overrideRules values must be objects in structure.config.json');
    }
  }

  if (packageImportRules) {
    if (!Array.isArray(packageImportRules)) {
      throw new Error('packageImportRules must be an array in structure.config.json');
    }

    for (const rule of packageImportRules) {
      if (!rule?.name?.trim()) {
        throw new Error(
          'Each packageImportRule must have a non-empty name property in structure.config.json',
        );
      } else if (
        Array.isArray(rule?.importNames) &&
        rule.importNames.length &&
        rule.importNames.some((name) => !name?.trim())
      ) {
        throw new Error(
          'importNames in packageImportRule must be an array of non-empty strings in structure.config.json',
        );
      } else if (
        !Array.isArray(rule?.allowedInFolders) ||
        rule.allowedInFolders.length === 0
      ) {
        throw new Error(
          'allowedInFolders in packageImportRule must be a non-empty array in structure.config.json',
        );
      } else if (rule.allowedInFolders.some((folder) => !folders.includes(folder))) {
        throw new Error(
          'allowedInFolders in packageImportRule contains invalid folder names not present in dependencyFlowchart in structure.config.json',
        );
      }
    }
  }

  if (getLintFiles instanceof Function === false) {
    throw new Error('getLintFiles must be a function in structure.config.json');
  }

  return {
    appAlias,
    dependencyFlowchart,
    docs,
    overrideRules,
    packageImportRules,
    getLintFiles,
  } as DefineOptions<F>;
}
