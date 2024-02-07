import type { Callback } from './types.js';
import { isProduction } from './init.js';
import { errToString } from './catch-error.js';

export interface RetryOptions {
  retries?: number;
  retryIntervalMs?: number;
  failMessage?: (err: string, retries: number) => string;
}

/** Run a function in async for the the desired amount of times, if it fails the last retry, it will throw an error. */
export const withRetry = <T>(callback: Callback<T>, { retries = 10, retryIntervalMs = 1000, failMessage }: RetryOptions = {}) => {
  return new Promise<T>((resolve, reject) => {
    const handle = async () => {
      try {
        const maybe = await callback();
        resolve(maybe);
      } catch (err) {
        if (retries === 0) {
          reject(err);
          return;
        }
        if (!isProduction) {
          // eslint-disable-next-line no-console
          console.log(
            failMessage ? failMessage(errToString(err), retries) : `Function fail, try again, error: ${errToString(err)}, retries: ${retries}`,
          );
        }
        retries -= 1;
        setTimeout(handle, retryIntervalMs);
      }
    };
    handle();
  });
};
