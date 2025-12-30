import cacache from 'cacache';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

import type { DefineOptions, DocsOptions, FlowchartConfig } from '../lint/types';

export const CACHE_PATH = path.resolve(process.cwd(), 'node_modules/.cache/kekkai');
export const CACHE_KEY = 'dependency-flowchart-hash';

const DEFAULT_CONTENT = `
This project follows a **One-way Dependency Flow** principle:

- Each folder may only import modules that lie downstream along the arrow direction
- Upstream or reverse imports are not allowed

> This rule is also enforced via **ESLint**.
`;

export async function generateDocs<F extends string>({
  dependencyFlowchart,
  docs,
}: Required<Pick<DefineOptions<F>, 'dependencyFlowchart' | 'docs'>>) {
  const marker = getMarker(docs.markerTag);

  if (isDocsValid(docs, marker.regex)) {
    const { content = DEFAULT_CONTENT } = docs;
    const docsFile = fs.readFileSync(path.resolve(process.cwd(), docs.file), 'utf-8');

    fs.writeFileSync(
      path.resolve(process.cwd(), docs.file),
      [
        docsFile.slice(0, docsFile.indexOf(marker.tag[0]) + marker.tag[0].length),
        '```mermaid',
        'flowchart TD',
        ...dependencyFlowchart.map(
          ([from, to, options]) =>
            `  ${from} ${!options?.label ? '' : `-- ${options.label} `}--> ${to}`,
        ),
        '```',
        content,
        docsFile.slice(docsFile.indexOf(marker.tag[1])),
      ].join('\n'),
    );

    try {
      execSync(`npm exec -- prettier --write "${docs.file}"`, { stdio: 'inherit' });
    } catch {
      console.warn('Prettier formatting failed for the documentation file.');
    }

    await makeCache(dependencyFlowchart);
  }
}

async function makeCache<F extends string>(flowchart: FlowchartConfig<F>[]) {
  const hash = createHash('sha256')
    .update(
      JSON.stringify(
        flowchart
          .slice()
          .sort(([f1, t1], [f2, t2]) => f1.localeCompare(f2) || t1.localeCompare(t2)),
      ),
    )
    .digest('hex');

  const cachedHash = await cacache
    .get(CACHE_PATH, CACHE_KEY)
    .then(({ data }) => data.toString('utf-8'))
    .catch(() => null);

  if (cachedHash === hash) {
    return;
  }

  await cacache.put(CACHE_PATH, CACHE_KEY, hash);
}

function getMarker(markerTag: string) {
  return {
    tag: [`<!-- ${markerTag}:START -->`, `<!-- ${markerTag}:END -->`] as const,
    regex: [
      new RegExp(`<!--\\s*${markerTag}:START\\s*-->`),
      new RegExp(`<!--\\s*${markerTag}:END\\s*-->`),
    ] as const,
  };
}

function isDocsValid(
  { file, markerTag }: DocsOptions,
  [startRegex, endRegex]: Readonly<[RegExp, RegExp]>,
) {
  let docs: string;

  try {
    docs = fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');
  } catch {
    throw new Error(`The specified documentation file "${file}" does not exist.`);
  }

  if (!startRegex.test(docs)) {
    throw new Error(
      `The start marker must be "<!-- ${markerTag}:START -->" in the documentation file.`,
    );
  } else if (!endRegex.test(docs)) {
    throw new Error(
      `The end marker must be "<!-- ${markerTag}:END -->" in the documentation file.`,
    );
  }

  return true;
}
