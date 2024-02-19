import path from 'node:path';
import { isProduction, readJSON, rm, saveFile, use } from './init.js';

interface Cache {
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

const cachedRequest = async <T>(
  name: string,
  callback: () => Promise<T>,
  options?: { customId?: string; expires?: number; store?: boolean },
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<T> => {
  if (!initCacheDir) {
    initCacheDir = use('cache');
    initStoredCacheNamePath = path.join(initCacheDir, 'cache-info.json');
  }
  const currentTime = Date.now();
  let cache = options?.store ? await getStored(name) : caches[name];

  if (options?.customId && options.customId !== cache?.customId) {
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

  if (cache) {
    if (options?.expires) {
      if (currentTime - cache.timestamp < options.expires) {
        // eslint-disable-next-line no-console
        if (!isProduction) console.log('Returned from cache, expires in:', options.expires - (currentTime - cache.timestamp));
        return cache.data as T;
      }
    } else {
      return cache.data as T;
    }
  }

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

const clearAllCache = () => {
  if (!initCacheDir) {
    initCacheDir = use('cache');
  }
  if (!initStoredCacheNamePath) {
    initStoredCacheNamePath = path.join(initCacheDir, 'cache-info.json');
  }
  return rm([initCacheDir, initStoredCacheNamePath]);
};

const cache = {
  add: cachedRequest,
  clearAll: clearAllCache,
};

export default cache;
