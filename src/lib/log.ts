import { inspect } from 'node:util';

export const log = (message?: unknown, ...opts: unknown[]) => {
  console.log(inspectLog(message), opts.map((t) => inspectLog(t)).join(' '));
};

const inspectLog = (message: unknown) => {
  if (typeof message === 'string' || typeof message === 'number') return message;
  return inspect(message, {
    // eslint-disable-next-line unicorn/no-null
    maxArrayLength: null,
    // eslint-disable-next-line unicorn/no-null
    depth: null,
  });
};
