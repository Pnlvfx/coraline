let c: string | undefined;

export interface Cache {
  timestamp: number;
  data: unknown;
}

const caches: Partial<Record<string, Cache>> = {};

export const cachedRequest = async <T>(
  name: string,
  callback: () => Promise<T>,
  options: { customId?: string; cacheDuration?: number },
): Promise<T> => {
  const currentTime = Date.now();
  let cache = caches[name];
  if (options.customId && options.customId !== c) {
    const data = await callback();
    cache = {
      data,
      timestamp: currentTime,
    };
    caches[name] = cache;
    c = options.customId;
    console.log('Different custom, fetching new data for', name);
    return data;
  }
  const MAX = options.cacheDuration || 20_000;
  if (cache && currentTime - cache.timestamp < MAX) {
    console.log('Returned from cache');
    caches[name] = {
      data: cache.data,
      timestamp: currentTime,
    };
    if (options.customId) {
      c = options.customId;
    }
    return cache.data as T;
  }

  const data = await callback();
  cache = {
    data,
    timestamp: currentTime,
  };
  caches[name] = cache;
  console.log('Cache expired fetching new data for', name);
  if (options.customId) {
    c = options.customId;
  }
  return data;
};
