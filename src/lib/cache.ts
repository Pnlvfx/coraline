import type { Callback } from 'coraline-client';
import path from 'node:path';
import { readJSON, rm, saveFile, use } from './init.js';

interface Cache<T> {
  timestamp: number;
  data: T;
  isStored: boolean;
  customId?: string;
}

const caches: Partial<Record<string, Cache<unknown>>> = {};
let cacheDir: string | undefined;

const getStored = async <T>(name: string) => {
  try {
    if (!cacheDir) {
      cacheDir = use('cache');
    }
    const file = path.join(cacheDir, `${name}.json`);
    return await readJSON<Cache<T>>(file);
  } catch {
    return;
  }
};

const store = async <T>(cache: Cache<T>, name: string) => {
  if (!cacheDir) {
    cacheDir = use('cache');
  }
  const file = path.join(cacheDir, `${name}.json`);
  await saveFile(file, JSON.stringify(cache));
};

const useCache = async <T>(name: string, callback: Callback<T>, options?: { customId?: string; expires?: number; store?: boolean }): Promise<T> => {
  const saved = options?.store ? await getStored(name) : caches[name];
  const currentTime = Date.now();

  if (!saved || options?.customId !== saved.customId || (options?.expires && currentTime - saved.timestamp > options.expires)) {
    const newCache = {
      data: await callback(),
      timestamp: currentTime,
      isStored: options?.store || false,
    };
    caches[name] = newCache;

    if (options?.store) {
      await store(newCache, name);
    }
    return newCache.data;
  }

  return saved.data as T;
};

const cache = {
  use: useCache,
  clear: async (name: string) => {
    if (!cacheDir) {
      cacheDir = use('cache');
    }
    await rm(path.join(cacheDir, `${name}.json`));
    delete caches[name];
  },
  clearAll: () => {
    if (!cacheDir) {
      cacheDir = use('cache');
    }
    Object.entries(caches).map(([key]) => {
      delete caches[key];
    });
    return rm(cacheDir);
  },
};

export default cache;
