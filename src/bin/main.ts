import ora from 'ora';

import { generateDocs } from './utils';
import { loadStructureConfig } from '../lint/utils';
import type { DefineOptions } from '../lint/types';

const spinner = ora('Generating Docs Content...').start();
let config: DefineOptions<string> | null = null;

try {
  config = loadStructureConfig();
  spinner.succeed('structure.config.json loaded successfully.');
} catch (e) {
  spinner.fail(`Failed to load structure.config.json: ${(e as Error).message}`);
  config = null;
}

if (config && config.docs) {
  const { dependencyFlowchart, docs } = config;

  generateDocs({ dependencyFlowchart, docs })
    .then(() => spinner.succeed('Docs generated successfully.'))
    .catch((e) => spinner.fail(`Failed to generate docs: ${(e as Error).message}`));
}
