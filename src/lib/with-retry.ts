import coraline, { errToString } from '../index.js';
import { isProduction } from './init.js';

export interface RetryOptions {
  retries?: number;
  retryIntervalMs?: number;
  failMessage?: string;
}
/** Run a function in async for the the desired amount of times, if it fails the last retry, it will throw an error. */
export const withRetry = async <T>(fn: () => Promise<T>, { retries = 10, retryIntervalMs = 1000, failMessage }: RetryOptions): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    if (!isProduction) {
      if (!failMessage) {
        failMessage = `Function fail, try again, error: ${errToString(err)}, retries: ${retries}`;
      }
      console.log(failMessage);
    }
    await coraline.wait(retryIntervalMs);
    return withRetry(fn, {
      retries: retries - 1,
      retryIntervalMs,
    });
  }
};
