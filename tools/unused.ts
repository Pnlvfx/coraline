import coraline from '../src/coraline.js';

const unused = coraline.findUnusedExports({
  ignoreFiles: ['coraline.ts', 'eslint.config.js'],
  ignoreVars: ['InputOptions', 'UnusedOptions', 'Analysis'],
});

if (unused) {
  throw new Error(`The following exports are unused, add them on the ignore or remove the exports to continue.\n${JSON.stringify(unused)}`);
}
