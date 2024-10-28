import { findUnusedExports } from '../src/lib/ts-unused-exports.js';

const unused = findUnusedExports({
  ignoreFiles: ['coraline.ts', 'eslint.config.js', 'jest.config.ts'],
  ignoreVars: ['InputOptions'],
});

if (unused) {
  throw new Error(`The following exports are unused, add them on the ignore or remove the exports to continue.\n${JSON.stringify(unused)}`);
}
