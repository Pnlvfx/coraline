let c: string | undefined;

export interface Cache {
  timestamp: number;
  data: unknown;
  custom?: number;
}

const caches: Partial<Record<string, Cache>> = {};

export const cachedRequest = async <T>(
  name: string,
  callback: () => Promise<T>,
  options: { custom?: string; cacheDuration?: number },
): Promise<T> => {
  const currentTime = Date.now();
  let cache = caches[name];
  if (options.custom && options.custom !== c) {
    const data = await callback();
    cache = {
      data,
      timestamp: currentTime,
    };
    caches[name] = cache;
    c = options.custom;
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
    if (options.custom) {
      c = options.custom;
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
  if (options.custom) {
    c = options.custom;
  }
  return data;
};
