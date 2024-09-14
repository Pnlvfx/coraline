import coraline from '../src/coraline';

const unused = await coraline.findUnusedExports({ ignoreFiles: ['coraline.ts'], ignoreVars: ['InputOptions', 'UnusedExports', 'UnusedOptions'] });

if (unused) {
  console.log(unused);
}
