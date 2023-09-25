import path from 'node:path';
import { readJSON, saveFile, use } from './init.js';

export interface Cache {
  timestamp: number;
  data: unknown;
  isStored: boolean;
  customId?: string;
}

type CacheInfo = Record<string, { isValid: boolean }>;

const caches: Partial<Record<string, Cache>> = {};
const cacheDir = use('cache');
const storedCacheNamePath = path.join(cacheDir, 'cache-info.json');
const cacheInfo: Partial<CacheInfo> = {};

const getCache = async (name: string) => {
  if (cacheInfo[name]) return cacheInfo[name];
  try {
    const info = await readJSON<typeof cacheInfo>(storedCacheNamePath);
    if (!info[name]) return;
    return info[name];
  } catch {
    return { isValid: false };
  }
};

const getStored = async (name: string) => {
  const info = await getCache(name);
  if (!info || !info?.isValid) return;
  const file = path.join(cacheDir, `${name}.json`);
  return readJSON<Cache>(file);
};

const store = async (cache: Cache, name: string) => {
  const file = path.join(cacheDir, `${name}.json`);
  await saveFile(file, JSON.stringify(cache));
  cacheInfo[name] = { isValid: true };
  await saveFile(storedCacheNamePath, JSON.stringify(cacheInfo));
};

export const cachedRequest = async <T>(
  name: string,
  callback: () => Promise<T>,
  options?: { customId?: string; cacheDuration?: number; store?: boolean },
): Promise<T> => {
  const currentTime = Date.now();
  let cache = options?.store ? await getStored(name) : caches[name];

  if (options?.customId && options.customId !== cache?.customId) {
    console.log('Different customId, fetching new data for', name);
    const data = await callback();
    cache = {
      data,
      timestamp: currentTime,
      isStored: options.store || false,
      customId: options.customId,
    };
    caches[name] = cache;

    if (options?.store) {
      await store(cache, name);
    }

    return data;
  }

  const MAX = options?.cacheDuration || 20_000;

  if (cache && currentTime - cache.timestamp < MAX) {
    console.log('Returned from cache, expires in:', MAX - (currentTime - cache.timestamp));
    return cache.data as T;
  }

  console.log('Cache expired fetching new data for', name);

  const data = await callback();
  cache = {
    data,
    timestamp: currentTime,
    isStored: options?.store || false,
  };
  caches[name] = cache;

  if (options?.store) {
    await store(cache, name);
  }
  return data;
};
