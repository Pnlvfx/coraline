import { inspect } from 'node:util';
import { isProduction } from './shared.js';

export const log = (message?: unknown, ...opts: unknown[]) => {
  if (isProduction) throw new Error('Do not use coraline.log in production as it is used only for debugging purposes.');
  // eslint-disable-next-line no-console
  console.log(inspectLog(message), opts.map((t) => inspectLog(t)).join(' '));
};

const inspectLog = (message: unknown) => {
  if (typeof message === 'string' || typeof message === 'number') return message;
  return inspect(message, {
    // eslint-disable-next-line unicorn/no-null
    maxArrayLength: null,
    // eslint-disable-next-line unicorn/no-null
    depth: null,
    colors: true,
  });
};
