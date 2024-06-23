import path from 'node:path';
import analyzeTsConfig from 'ts-unused-exports';

type Analysis = { exportName: 'string'; location?: unknown };

export interface UnusedExports {
  [key: string]: Analysis[];
}

/** Find a list of unused funtions on your code. The ignore parameter is an array of export name that could be ignored. */
export const findUnusedExports = (ignore: string[] = []) => {
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Do not use findUnusedExports in production as it will slow down your app performance.');
  }
  const analyzed = analyzeTsConfig(path.resolve('.', 'tsconfig.json')) as unknown as UnusedExports;
  Object.entries(analyzed).map(([key, value]) => {
    value.map((v) => {
      if (ignore.includes(v.exportName)) {
        delete analyzed[key];
      }
    });
  });
  return Object.keys(analyzed).length > 0 ? analyzed : undefined;
};
