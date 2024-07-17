/* eslint-disable no-console */
import { Callback } from 'coraline-client';

export const benchmark = async <T>(name: string, callback: Callback<T>) => {
  console.time(name);
  try {
    const maybe = await callback();
    console.timeEnd(name);
    return maybe;
  } catch (err) {
    console.timeEnd(name);
    throw err;
  }
};
