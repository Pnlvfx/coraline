import { inspect } from 'node:util';
import { isProduction } from './shared.js';
import { temporaryFile } from './tempy.js';
import fs from 'node:fs/promises';

export const logToFile = async (data: unknown) => {
  if (isProduction) throw new Error('Do not use coraline.log in production as it is used only for debugging purposes.');
  let file: string | undefined;
  if (typeof data === 'string' || typeof data === 'number') {
    file = await temporaryFile({ extension: '' });
    await fs.writeFile(file, data.toString());
  } else if (Array.isArray(data) || (typeof data === 'object' && data !== null)) {
    file = await temporaryFile({ extension: 'json' });
    await fs.writeFile(file, JSON.stringify(data));
  } else {
    throw new Error(`Unsupported data for logging: ${JSON.stringify(data)}`);
  }
  // eslint-disable-next-line no-console
  console.log(file);
};

export const log = (message?: unknown, ...opts: unknown[]) => {
  if (isProduction) throw new Error('Do not use coraline.log in production as it is used only for debugging purposes.');
  // eslint-disable-next-line no-console
  console.log(inspectLog(message), opts.map((t) => inspectLog(t)).join(' '));
};

// eslint-disable-next-line sonarjs/function-return-type
const inspectLog = (message: unknown) => {
  if (typeof message === 'string' || typeof message === 'number') return message;
  return inspect(message, {
    maxArrayLength: Infinity,
    depth: Infinity,
    colors: true,
  });
};
