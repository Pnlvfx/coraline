import path from 'node:path';
import analyzeTsConfig from 'ts-unused-exports';

export const findUnusedExports = () => {
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Do not use findUnusedExports in production as it will slow down your app performance.');
  }
  return analyzeTsConfig(path.resolve('.', 'tsconfig.json'));
};
