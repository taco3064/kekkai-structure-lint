#!/usr/bin/env node
import ora from 'ora';
import path from 'node:path';

import { generateDocs, isCliEntry } from './utils';
import { loadStructureConfig } from '../lint/utils';
import type { DefineOptions } from '../lint/types';

export async function run() {
  const spinner = ora('Generating Docs Content...').start();
  let config: DefineOptions<string>;

  try {
    config = loadStructureConfig();
    spinner.succeed('structure.config.json loaded successfully.');
  } catch (e) {
    spinner.fail(`Failed to load structure.config.json: ${(e as Error).message}`);

    return 1;
  }

  if (!config.docs) {
    spinner.info('No docs config found. Skip docs generation.');

    return 0;
  }

  const { dependencyFlow, docs } = config;

  try {
    await generateDocs({
      dependencyFlow,
      docs,
      prettier: path.resolve(process.cwd(), 'node_modules/.bin/prettier'),
    });

    spinner.succeed('Docs generated successfully.');

    return 0;
  } catch (e) {
    spinner.fail(`Failed to generate docs: ${(e as Error).message}`);

    return 1;
  }
}

if (isCliEntry(process.argv[1])) {
  run().then((code) => process.exit(code));
}
