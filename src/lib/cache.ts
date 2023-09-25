import path from 'node:path';
import coraline from '../index.js';
import { use } from './init.js';

let c: string | undefined;

export interface Cache {
  timestamp: number;
  data: unknown;
}

const caches: Partial<Record<string, Cache>> = {};
const cacheDir = use('cache');

export const cachedRequest = async <T>(
  name: string,
  callback: () => Promise<T>,
  options?: { customId?: string; cacheDuration?: number; store?: boolean },
): Promise<T> => {
  const currentTime = Date.now();
  let cache = caches[name];
  if (options?.customId && options.customId !== c) {
    const data = await callback();
    cache = {
      data,
      timestamp: currentTime,
    };
    caches[name] = cache;
    c = options.customId;
    console.log('Different custom, fetching new data for', name);

    if (options?.store) {
      const file = path.join(cacheDir, `${name}.json`);
      await coraline.saveFile(file, JSON.stringify(data));
    }

    return data;
  }
  const MAX = options?.cacheDuration || 20_000;
  if (cache && currentTime - cache.timestamp < MAX) {
    console.log('Returned from cache');
    caches[name] = {
      data: cache.data,
      timestamp: currentTime,
    };
    if (options?.customId) {
      c = options.customId;
    }
    return cache.data as T;
  }

  if (options?.store) {
    const file = path.join(cacheDir, `${name}.json`);
    const data = await coraline.readJSON<T>(file);
    caches[name] = {
      data,
      timestamp: currentTime,
    };
    if (options?.customId) {
      c = options.customId;
    }
    return data;
  }

  console.log('Cache expired fetching new data for', name);

  const data = await callback();
  cache = {
    data,
    timestamp: currentTime,
  };
  caches[name] = cache;

  if (options?.store) {
    const file = path.join(cacheDir, `${name}.json`);
    await coraline.saveFile(file, JSON.stringify(data));
  }

  if (options?.customId) {
    c = options.customId;
  }
  return data;
};
