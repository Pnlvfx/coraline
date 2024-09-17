import coraline from '../src/coraline';

const unused = coraline.findUnusedExports({
  ignoreFiles: ['coraline.ts'],
  ignoreVars: ['InputOptions', 'UnusedOptions', 'Analysis'],
});

if (unused) {
  throw new Error(`The following exports are unused, add them on the ignore or remove the exports to continue.\n${JSON.stringify(unused)}`);
}
