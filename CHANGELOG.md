# @kekkai/structure-lint

## 1.2.0

### Minor Changes

- Strengthen validation and close the `selfOnly` re-export bypass.

  **New features**
  - `dependencyFlow` now validates for circular dependencies at config load time and throws a clear error with the cycle path (e.g. `a → b → a`).
  - `selfOnly: true` edges now also prevent the `from` folder from re-exporting anything from the `to` folder via `export { X } from` or `export * from`. A `no-restricted-syntax` rule is generated for each affected folder to close the barrel-file bypass.

  **Fixes**
  - `PackageImportRule` is now exported from the package entry point so consumers can type-annotate their configs without reaching into internal paths.
  - `lintFilesIgnore: []` (empty array) now throws a validation error, consistent with how `lintFiles` handles empty input.
  - `exemptFilePatterns: []` (empty array) in a `packageImportRule` now throws a validation error.
  - Setting `no-restricted-imports` inside `overrideRules` now throws a clear error instead of being silently discarded.
  - Removed a misleading note in README that claimed per-folder severity could be configured via `overrideRules` (it cannot for `no-restricted-imports`).

## 1.1.1

### Patch Changes

- 5107603: Add Codecov integration to publish test coverage and display a coverage badge in README.

## 1.1.0

### Minor Changes

- 73abcb4: Introduce `moduleLayout` configuration to adjust relative import rules based on folder-based or flat module structures.

## 1.0.0

### Major Changes

- We have officially released the npm package.
