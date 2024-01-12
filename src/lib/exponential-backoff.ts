import { isProduction } from './init.js';

export const backOff = <T>(fn: () => Promise<T>, maxAttempt = 5, baseDelayMs = 1000) => {
  let attempt = 1;

  const execute = async (): Promise<T> => {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= maxAttempt) throw err;
      const delayMs = baseDelayMs * 2 ** attempt;
      if (!isProduction) console.log(`Retry attempt ${attempt} after ${delayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      attempt++;
      return execute();
    }
  };

  return execute();
};
