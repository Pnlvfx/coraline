import { Callback, errToString } from '../index.js';
import { isProduction, wait } from './init.js';

export interface RetryOptions {
  retries?: number;
  retryIntervalMs?: number;
  failMessage?: string;
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
          if (!failMessage) {
            failMessage = `Function fail, try again, error: ${errToString(err)}, retries: ${retries}`;
          }
          console.log(failMessage);
        }
        await wait(retryIntervalMs);
        withRetry(callback, {
          retries: retries - 1,
          retryIntervalMs,
          failMessage,
        });
      }
    };
    handle();
  });
};
