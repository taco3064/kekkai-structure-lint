#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import ora from 'ora';
import path from 'node:path';

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
const spinner = ora('Running pre-release...').start();

try {
  // 1. version bump + changelog
  spinner.text = 'Running changeset version...';
  run('npx changeset version');

  // 2. read version
  const { version } = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'),
  );

  // 3. commit
  spinner.text = `Committing release ${version}...`;
  run('git add package.json CHANGELOG.md .changeset');
  run(`git commit -m "RELEASE: ${version}"`);
  run('git push');

  // 4. tag
  spinner.text = `Tagging ${version}...`;
  run(`git tag ${version}`);
  run('git push --tags');

  spinner.succeed(`Release ${version} completed`);
} catch (e) {
  spinner.fail('Pre-release failed');
  process.exit(1);
}
