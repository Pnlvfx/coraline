/* eslint-disable sonarjs/no-nested-template-literals */
/* eslint-disable sonarjs/cognitive-complexity */
import path from 'node:path';
import { analyzeTsConfig, type Analysis } from 'ts-unused-exports';

interface UnusedOptions {
  tsConfigPath?: string;
  ignoreVars?: string[];
  ignoreFiles?: string[];
}

/** Find all the unused variables in your code. */
export const findUnusedExports = ({ ignoreFiles, ignoreVars, tsConfigPath = path.resolve('.', 'tsconfig.json') }: UnusedOptions = {}) => {
  const analyzed = analyzeTsConfig(tsConfigPath);
  const response: Analysis = {};
  for (const [key, value] of Object.entries(analyzed)) {
    const filename = path.basename(key);
    if (ignoreFiles?.includes(filename)) {
      ignoreFiles.splice(ignoreFiles.indexOf(filename), 1);
      continue;
    }
    const filteredExports = [];
    for (const v of value) {
      if (ignoreVars?.includes(v.exportName)) {
        ignoreVars.splice(ignoreVars.indexOf(v.exportName), 1);
      } else {
        filteredExports.push(v);
      }
    }

    if (filteredExports.length > 0) {
      response[key] = filteredExports;
    }
  }

  if (ignoreFiles && ignoreFiles.length > 0) {
    throw new Error(
      `The following ignore entries are no longer needed: 
      ${ignoreFiles.length > 0 ? `Files: ${ignoreFiles.join(',\n')}` : ''}`,
    );
  }

  if (ignoreVars && ignoreVars.length > 0) {
    throw new Error(
      `The following ignore entries are no longer needed: 
      ${ignoreVars.length > 0 ? `Variables: ${ignoreVars.join(', ')}` : ''}`,
    );
  }

  return Object.keys(response).length > 0 ? response : undefined;
};
