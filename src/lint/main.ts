import type { ConfigWithExtendsArray } from '@eslint/config-helpers';

import * as Utils from './utils';
import type { DefineOptions, PackageImportRule } from './types';

export function createStructureLint<F extends string>(
  config?: Omit<DefineOptions<F>, 'docs'>,
): ConfigWithExtendsArray {
  const {
    appAlias,
    dependencyFlow,
    lintFiles,
    lintFilesIgnore,
    moduleLayout = 'folder',
    overrideRules,
    packageImportRules,
    additionalAliases,
    severity = 'error',
  } = config || Utils.loadStructureConfig<F>();

  const folders = Utils.extractAllFolders(dependencyFlow);
  const allAliases = [appAlias, ...Object.keys(additionalAliases ?? {})];

  const ignoreConfig = lintFilesIgnore
    ? [{ ignores: Array.isArray(lintFilesIgnore) ? lintFilesIgnore : [lintFilesIgnore] }]
    : [];

  const folderConfigs = folders.flatMap((folder) => {
    const disableFolderImports = Utils.getDisableFolderImports(
      dependencyFlow,
      folders,
      folder,
    );

    const disablePackageImports = packageImportRules?.filter(
      ({ allowedInFolders }) => !allowedInFolders.includes(folder),
    );

    const hasExemptRules = disablePackageImports?.some((r) => r.exemptFilePatterns?.length);

    const selfOnlyTargets = dependencyFlow
      .filter(([f, , opts]) => f === folder && opts?.selfOnly)
      .map(([, to]) => to);

    const selfOnlySyntaxRules = selfOnlyTargets.flatMap((target) =>
      allAliases.map((alias) => ({
        selector: makeSelfOnlyReexportSelector(alias, target),
        message: `\n🚫 Cannot re-export from "${target}" — this is a selfOnly dependency and must not be exposed to callers.`,
      })),
    );

    const buildPatterns = (rules: PackageImportRule<F>[] | undefined) => {
      const pathRules = rules?.filter((r) => !r.pattern) ?? [];
      const globRules = rules?.filter((r) => r.pattern) ?? [];

      return {
        paths: pathRules.length
          ? pathRules.map(({ name, importNames }) => ({
              name,
              importNames,
              message: importNames?.length
                ? `\n🚫 Do not import ${importNames.join(', ')} from "${name}" in this layer.`
                : `\n🚫 Do not import "${name}" in this layer.`,
            }))
          : undefined,
        extraPatterns: globRules.length
          ? globRules.map(({ name, importNames }) => ({
              group: [name],
              importNames: importNames?.length ? importNames : undefined,
              message: importNames?.length
                ? `\n🚫 Do not import ${importNames.join(', ')} from "${name}" in this layer.`
                : `\n🚫 Do not import "${name}" in this layer.`,
            }))
          : [],
      };
    };

    const buildStructuralPatterns = () => [
      {
        group: ['./../**', '././**'],
        message:
          '\n🚫 Redundant relative path segments (././, ./../) are not allowed. They bypass structural import rules.',
      },
      {
        group: [moduleLayout === 'folder' ? '../*/**' : '../**'],
        message:
          '\n🚫 Do not import from upper-level directories. Use the project alias (e.g. "~app/*") to follow the dependency flow.',
      },
      ...allAliases.map((alias) => ({
        group: [`${alias}/${folder}/**`],
        message:
          moduleLayout === 'flat'
            ? `\n🚫 Same-layer imports must use a relative path.\n   Replace "${alias}/${folder}/X" with "./X". (If the same module is needed across multiple folders, extract it to a lower-level layer.)`
            : '\n🚫 Do not import modules from the same layer. Extract shared logic into a lower-level folder if needed.',
      })),
      ...(!disableFolderImports.length
        ? []
        : [
            {
              group: disableFolderImports.flatMap((banFolder) =>
                allAliases.map((alias) => `${alias}/${banFolder}/**`),
              ),
              message:
                '\n🚫 This import violates the folder dependency rule. Only import from allowed lower-level folders.',
            },
          ]),
    ];

    const buildConfig = (rules: PackageImportRule<F>[] | undefined, ignores?: string[]) => {
      const { paths, extraPatterns } = buildPatterns(rules);
      const structuralPatterns = buildStructuralPatterns();

      return {
        files: Utils.getLintFiles(folder, lintFiles),
        ...(ignores?.length ? { ignores } : {}),
        rules: {
          ...overrideRules?.[folder],
          'no-restricted-imports': [
            severity,
            {
              patterns: [...structuralPatterns, ...extraPatterns],
              ...(paths?.length ? { paths } : {}),
            },
          ] as [typeof severity, ...unknown[]],
          ...(selfOnlySyntaxRules.length
            ? {
                'no-restricted-syntax': [severity, ...selfOnlySyntaxRules] as [
                  typeof severity,
                  ...unknown[],
                ],
              }
            : {}),
        },
      };
    };

    if (!hasExemptRules) {
      return [buildConfig(disablePackageImports)];
    }

    const exemptPatterns = [
      ...new Set(
        disablePackageImports!
          .flatMap((r) => r.exemptFilePatterns ?? [])
          .filter(Boolean),
      ),
    ];

    const nonExemptRules = disablePackageImports!.filter((r) => !r.exemptFilePatterns?.length);

    return [
      // Config 1: all folder files (incl. exempt) — only non-exempt package restrictions
      buildConfig(nonExemptRules),
      // Config 2: non-exempt files only (ignores exempt patterns) — all package restrictions
      buildConfig(disablePackageImports, exemptPatterns),
    ];
  });

  return [...ignoreConfig, ...folderConfigs];
}

function makeSelfOnlyReexportSelector(alias: string, target: string): string {
  const esc = (s: string) =>
    s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\//g, '\\/');

  const attr = `[source.value=/^${esc(alias)}\\/${esc(target)}\\//]`;

  return `ExportNamedDeclaration${attr}, ExportAllDeclaration${attr}`;
}
