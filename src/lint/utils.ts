import fs from 'node:fs';
import path from 'node:path';
import type { JsonValue, JsonObject } from 'type-fest';

import type { DefineOptions, FlowchartConfig } from './types';

const LINT_FILES_REGEX = /\{\s*folder\s*\}/;

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
        if (!options?.selfOnly || root) {
          acc.push(to, ...getAllowedFolders(config, to, false));
        }
      }

      return acc;
    }, []);
  })(config, folder, true);

  return folders.filter((f) => !allowedFolders.includes(f) && f !== folder);
}

export function getLintFiles<F extends string>(
  folder: F,
  lintFiles: string | string[],
): string[] {
  const files = Array.isArray(lintFiles) ? lintFiles : [lintFiles];

  return files.map((file) => file.replace(LINT_FILES_REGEX, folder));
}

export function loadStructureConfig<F extends string>(
  defaultConfigPath = 'structure.config.json',
) {
  const configPath = path.resolve(process.cwd(), defaultConfigPath);

  if (!fs.existsSync(configPath)) {
    throw new Error(`structure.config.json not found at ${configPath}`);
  }

  return isConfigValid<F>(JSON.parse(fs.readFileSync(configPath, 'utf-8')));
}

export function isConfigValid<F extends string>({
  appAlias,
  dependencyFlowchart,
  docs,
  lintFiles,
  overrideRules,
  packageImportRules,
}: Partial<Record<keyof DefineOptions<F>, JsonValue>>): DefineOptions<F> {
  if (typeof appAlias !== 'string' || !appAlias?.trim()) {
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
      } else if (
        typeof item[0] !== 'string' ||
        typeof item[1] !== 'string' ||
        !item[0]?.trim() ||
        !item[1]?.trim()
      ) {
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

  const folders = extractAllFolders(dependencyFlowchart as FlowchartConfig<F>[]);

  if (docs) {
    const { file, markerTag, content } = docs as JsonObject;

    if (typeof file !== 'string' || !file?.trim()) {
      throw new Error(
        'docs.file is required in structure.config.json if docs is provided',
      );
    } else if (typeof markerTag !== 'string' || !markerTag?.trim()) {
      throw new Error(
        'docs.markerTag is required in structure.config.json if docs is provided',
      );
    } else if (content && typeof content !== 'string') {
      throw new Error('docs.content must be a string in structure.config.json');
    }
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
      const { name, importNames, allowedInFolders } = (rule || {}) as JsonObject;

      if (typeof name !== 'string' || !name?.trim()) {
        throw new Error(
          'Each packageImportRule must have a non-empty name property in structure.config.json',
        );
      } else if (
        Array.isArray(importNames) &&
        importNames.length &&
        importNames.some((name) => typeof name !== 'string' || !name?.trim())
      ) {
        throw new Error(
          'importNames in packageImportRule must be an array of non-empty strings in structure.config.json',
        );
      } else if (!Array.isArray(allowedInFolders) || allowedInFolders.length === 0) {
        throw new Error(
          'allowedInFolders in packageImportRule must be a non-empty array in structure.config.json',
        );
      } else if (allowedInFolders.some((folder) => !folders.includes(folder as F))) {
        throw new Error(
          'allowedInFolders in packageImportRule contains invalid folder names not present in dependencyFlowchart in structure.config.json',
        );
      }
    }
  }

  const files = (Array.isArray(lintFiles) ? lintFiles : [lintFiles]) as string[];

  if (!files.length) {
    throw new Error('lintFiles is required in structure.config.json');
  } else {
    for (const file of files) {
      if (typeof file !== 'string' || !file?.trim()) {
        throw new Error(
          'lintFiles must be a non-empty string or an array of non-empty strings in structure.config.json',
        );
      } else if (!LINT_FILES_REGEX.test(file)) {
        throw new Error(
          'Each lintFiles entry must include the "{folder}" placeholder in structure.config.json',
        );
      }
    }
  }

  return {
    appAlias,
    dependencyFlowchart,
    docs,
    lintFiles: files,
    overrideRules,
    packageImportRules,
  } as DefineOptions<F>;
}
