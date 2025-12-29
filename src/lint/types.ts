import type { RulesConfig } from '@eslint/core';

interface PackageImportRule<F extends string> {
  name: string;
  importNames?: string[];
  allowedInFolders: F[];
}

export interface DocsOptions {
  file: string;
  markerTag: string;
  content?: string;
}

export type FlowchartConfig<F extends string> = [
  F,
  F,
  {
    label?: string;
    selfOnly?: boolean;
  }?,
];

export interface DefineOptions<F extends string> {
  appAlias: string;
  dependencyFlowchart: FlowchartConfig<F>[];
  docs?: DocsOptions;
  lintFiles: string | string[];
  overrideRules?: Partial<Record<F, Partial<RulesConfig>>>;
  packageImportRules?: PackageImportRule<F>[];
}
