import path from 'node:path';
import { isProduction } from './init.js';
import analyzeTsConfig from 'ts-unused-exports';

export const findUnusedExports = () => {
  if (isProduction) throw new Error('Do not use findUnusedExports in production as it will slow down your app performance.');
  return analyzeTsConfig.default(path.resolve('.', 'tsconfig.json'));
};
