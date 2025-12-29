import type { ConfigWithExtendsArray } from '@eslint/config-helpers';

import * as Utils from './utils';
import type { DefineOptions } from './types';

export function defineConfig<F extends string>(
  {
    appAlias,
    dependencyFlowchart,
    lintFiles,
    overrideRules,
    packageImportRules,
  }: Omit<DefineOptions<F>, 'docs'> = Utils.loadStructureConfig<F>(),
): ConfigWithExtendsArray {
  const folders = Utils.extractAllFolders(dependencyFlowchart);

  return folders.map((folder) => {
    const disableFolderImports = Utils.getDisableFolderImports(
      dependencyFlowchart,
      folders,
      folder,
    );

    const disablePackageImports = packageImportRules?.filter(
      ({ allowedInFolders }) => !allowedInFolders.includes(folder),
    );

    return {
      files: Utils.getLintFiles(folder, lintFiles),
      rules: {
        ...overrideRules?.[folder],
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['../*/**'],
                message:
                  '\n🚫 Do not import from upper-level directories. Use the project alias (e.g. "~app/*") to follow the dependency flow.',
              },
              {
                group: [`${appAlias}/${folder}/**`],
                message:
                  '\n🚫 Do not import modules from the same layer. Extract shared logic into a lower-level folder if needed.',
              },
              ...(!disableFolderImports.length
                ? []
                : [
                    {
                      group: disableFolderImports.map(
                        (banFolder) => `${appAlias}/${banFolder}/**`,
                      ),
                      message:
                        '\n🚫 This import violates the folder dependency rule. Only import from allowed lower-level folders.',
                    },
                  ]),
            ],
            ...(disablePackageImports?.length && {
              paths: disablePackageImports.map(({ name, importNames }) => ({
                name,
                importNames,
                message: importNames?.length
                  ? `\n🚫 Do not import ${importNames.join(
                      ', ',
                    )} from "${name}" in this layer.`
                  : `\n🚫 Do not import "${name}" in this layer.`,
              })),
            }),
          },
        ],
      },
    };
  });
}
