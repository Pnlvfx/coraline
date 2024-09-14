import path from 'node:path';

export interface Analysis {
  exportName: 'string';
  location: undefined;
}

export type UnusedExports = Record<string, Analysis[]>;

const getModule = async () => {
  try {
    const analyzeTsConfig = await import('ts-unused-exports');
    return analyzeTsConfig.default as unknown as (config: string) => UnusedExports;
  } catch {
    throw new Error(
      'To use findUnusedExports you need to have ts-unused-exports installed.\nPlease run "npm install -D ts-unused-exports" to install it.',
    );
  }
};

export interface UnusedOptions {
  ignoreVars?: string[];
  ignoreFiles?: string[];
}

/** Find all the unused variables in your code. */
export const findUnusedExports = async ({ ignoreFiles, ignoreVars }: UnusedOptions = {}) => {
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Do not use findUnusedExports in production as it will slow down your app performance.');
  }
  const analyzeTsConfig = await getModule();
  const analyzed = analyzeTsConfig(path.resolve('.', 'tsconfig.json'));
  const response: Record<string, Analysis[]> = {};
  for (const [key, value] of Object.entries(analyzed)) {
    const filename = path.basename(key);
    if (ignoreFiles?.includes(filename)) continue;
    if (value.some((v) => ignoreVars?.includes(v.exportName))) continue;
    response[key] = value;
  }
  return Object.keys(response).length > 0 ? response : undefined;
};
