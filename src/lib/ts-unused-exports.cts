import path from 'node:path';
import analyzeTsConfig from 'ts-unused-exports';

interface Analysis {
  exportName: 'string';
  location?: unknown;
}

export type UnusedExports = Record<string, Analysis[]>;

/** Find a list of unused funtions on your code. The ignore parameter is an array of export name that could be ignored. */
export const findUnusedExports = (ignore: string[] = []) => {
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Do not use findUnusedExports in production as it will slow down your app performance.');
  }
  const analyzed = analyzeTsConfig(path.resolve('.', 'tsconfig.json')) as unknown as UnusedExports;
  for (const [key, value] of Object.entries(analyzed)) {
    for (const v of value) {
      if (ignore.includes(v.exportName)) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete analyzed[key];
      }
    }
  }
  return Object.keys(analyzed).length > 0 ? analyzed : undefined;
};
