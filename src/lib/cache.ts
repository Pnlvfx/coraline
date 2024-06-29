import type { Callback } from 'coraline-client';
import type { CoralineStorage } from '../storage/storage.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readJSON, rm } from './shared.js';

interface Cache<T> {
  timestamp: number;
  data: T;
  isStored: boolean;
  customId?: string;
}

const cache = (storage: CoralineStorage) => {
  const cacheDir = storage.use('cache');
  const caches: Partial<Record<string, Cache<unknown>>> = {};

  const getStored = async <T>(name: string) => {
    try {
      const file = path.join(cacheDir, `${name}.json`);
      return await readJSON<Cache<T>>(file);
    } catch {
      return;
    }
  };

  const store = async <T>(cache: Cache<T>, name: string) => {
    const file = path.join(cacheDir, `${name}.json`);
    await fs.writeFile(file, JSON.stringify(cache));
  };

  return {
    use: async <T>(name: string, callback: Callback<T>, options?: { customId?: string; expires?: number; store?: boolean }): Promise<T> => {
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
    },
    clear: async (name: string) => {
      await rm(path.join(cacheDir, `${name}.json`));
      delete caches[name];
    },
    clearAll: () => {
      Object.entries(caches).map(([key]) => {
        delete caches[key];
      });
      return rm(cacheDir);
    },
  };
};

export default cache;
