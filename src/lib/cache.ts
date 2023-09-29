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
const cacheInfo: Partial<CacheInfo> = {};
let initCacheDir: string | undefined;
let initStoredCacheNamePath: string | undefined;

const getCache = async (name: string) => {
  if (!initStoredCacheNamePath) throw new Error('Invalid cache, please report it');
  if (cacheInfo[name]) return cacheInfo[name];
  try {
    const info = await readJSON<typeof cacheInfo>(initStoredCacheNamePath);
    if (!info[name]) return;
    return info[name];
  } catch {
    return { isValid: false };
  }
};

const getStored = async (name: string) => {
  const info = await getCache(name);
  if (!info || !info?.isValid || !initCacheDir) return;
  const file = path.join(initCacheDir, `${name}.json`);
  return readJSON<Cache>(file);
};

const store = async (cache: Cache, name: string) => {
  if (!initCacheDir || !initStoredCacheNamePath) throw new Error('Invalid cache store, please report it!');
  const file = path.join(initCacheDir, `${name}.json`);
  await saveFile(file, JSON.stringify(cache));
  cacheInfo[name] = { isValid: true };
  await saveFile(initStoredCacheNamePath, JSON.stringify(cacheInfo));
};

export const cachedRequest = async <T>(
  name: string,
  callback: () => Promise<T>,
  options?: { customId?: string; cacheDuration?: number; store?: boolean },
): Promise<T> => {
  if (!initCacheDir) {
    initCacheDir = use('cache');
    initStoredCacheNamePath = path.join(initCacheDir, 'cache-info.json');
  }
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
