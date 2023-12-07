import { promises as fs } from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { createScriptExec, generateRandomId, readJSON, saveFile, use, useStatic } from './lib/init.js';
import regex from './lib/regex.js';
import coralineDate from './lib/date.js';
import coralineMedia from './lib/media.js';
import coralineColors from './lib/colors.js';
import { inspect } from 'node:util';
import { URL } from 'node:url';
import { RetryOptions } from './types/index.js';
import os from 'node:os';
import { errToString } from './lib/catch-error.js';
import { cachedRequest } from './lib/cache.js';
import { getGptCommand } from './lib/gpt-command.js';

type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N ? Acc[number] : Enumerate<N, [...Acc, Acc['length']]>;

type Callback = () => Promise<void> | (() => void);

export type Range<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>;

export type Prettify<T> = {
  [K in keyof T]: T[K];
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};

const urlPrefix = ['http://', 'https://', 'ftp://'];

const coraline = {
  // THE CALLBACK SHOULD BECOME A CALLBACK TYPE
  wait: (ms: number, callback?: () => Promise<void>) => {
    return new Promise<void>((resolve, reject) =>
      setTimeout(() => {
        if (callback) {
          callback().then(resolve).catch(reject);
          return;
        }
        resolve();
      }, ms),
    );
  },
  createScriptExec,
  arrayMove: (arr: [], fromIndex: number, toIndex: number) => {
    const element = arr.at(fromIndex);
    if (!element) throw new Error('Invalid values provided');
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
  },
  getRandomInt: (max: number) => {
    return Math.floor(Math.random() * max);
  },
  year: (options?: { min?: number; max?: number }) => {
    const min = options?.min || 0;
    const max = options?.max || new Date().getFullYear();
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  getUniqueArray: <T extends Record<K, string>, K extends keyof T>(arr: T[], key: K): T[] => {
    return [...new Map(arr.map((item) => [item[key], item])).values()];
  },
  shuffleArray: <T>(array: T[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      const newVal = array.at(j);
      if (!temp || !newVal) throw new Error('Something went wrong');
      array[i] = newVal;
      array[j] = temp;
    }
  },
  createPermalink: (text: string) => {
    const perma = text.trim().replaceAll(' ', '_').replaceAll(/\W/g, '').toLowerCase().replaceAll('__', '_').slice(0, 50).trimEnd();
    if (perma.endsWith('_')) {
      perma.slice(-1);
    }
    return perma;
  },
  isUrl: (input: string) => {
    try {
      const url = new URL(input);
      for (const prefix of urlPrefix) {
        if (url.href.startsWith(prefix)) return true;
      }
      return false;
    } catch {
      return false;
    }
  },
  rm: async (files: string | string[]) => {
    const dieFiles = typeof files === 'string' ? [files] : files;
    for (const file of dieFiles) {
      try {
        await fs.rm(file, { recursive: true });
      } catch (err) {
        const error = err as NodeJS.ErrnoException;
        if (error.code !== 'ENOENT') throw err;
      }
    }
    return true;
  },
  clearFolder: async (folder: string) => {
    const contents = await fs.readdir(folder);
    for (const content of contents) {
      await coraline.rm(path.join(folder, content));
    }
  },
  runAtSpecificTime: (hour: number, minute: number, fn: Callback, repeat: boolean) => {
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    date.setSeconds(0);

    if (date < new Date()) {
      if (repeat) {
        date.setDate(date.getDate() + 1);
      } else {
        return;
      }
    }

    const timeUntilFunction = date.getTime() - Date.now();
    setTimeout(async () => {
      await fn();
      if (repeat) {
        await coraline.wait(1 * 60 * 1000);
        coraline.runAtSpecificTime(hour, minute, fn, true);
      }
    }, timeUntilFunction);
  },
  log: (message?: unknown) => {
    console.log(
      inspect(message, {
        // eslint-disable-next-line unicorn/no-null
        maxArrayLength: null,
        // eslint-disable-next-line unicorn/no-null
        depth: null,
        colors: true,
      }),
    );
  },
  performanceEnd: (start: number, api: string) => {
    const end = performance.now();
    const time = `api: ${api} took ${end - start} milliseconds`;
    return console.log(time);
  },
  memoryUsage: () => {
    const used = process.memoryUsage().heapUsed;
    const total = process.memoryUsage().heapTotal;
    const percentage = Math.round((used / total) * 10_000) / 100;
    console.log(`Heap usage: ${percentage}%`);
  },
  getContentType: (url: string) => {
    return new Promise<string>((resolve, reject) => {
      https
        .request(url, { method: 'HEAD' }, (res) => {
          if (res.statusCode !== 200) {
            return reject(new Error(`Failed to retrieve video: ${res.statusCode} ${res.statusMessage}`));
          }
          const contentType = res.headers['content-type'];
          if (!contentType) {
            return reject('This url does not have a content-type value!');
          }
          resolve(contentType);
        })
        .on('error', reject)
        .end();
    });
  },
  getVideoFileSizeInMb: async (url: string) => {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    if (!contentLength) throw new Error('Unable to determine file size. Content-Length header missing.');
    const fileSizeInBytes = Number.parseInt(contentLength, 10);
    const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
    return Number(fileSizeInMB.toFixed(2));
  },
  getUserAgent: () => {
    const system = os.platform();
    let userAgent = '';
    switch (system) {
      case 'darwin': {
        const macVersion = os.release().split('.')[0];
        const macArch = os.arch();
        userAgent = `Mozilla/5.0 (Macintosh; ${macArch} Mac OS X ${macVersion}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36`;
        break;
      }
      case 'linux': {
        userAgent = `Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:75.0) Gecko/20100101 Firefox/75.0`;

        break;
      }
      case 'win32': {
        const winVersion = os.release().split('.')[0];
        userAgent = `Mozilla/5.0 (Windows NT ${winVersion}; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36`;
        break;
      }
      default: {
        userAgent = `Mozilla/5.0 (compatible; Node.js/${process.version}; ${process.platform} ${process.arch})`;
      }
    }
    return userAgent;
  },
  generateRandomId,
  use,
  useStatic,
  saveFile,
  readJSON,
  getGptCommand,
  cachedRequest,
  media: coralineMedia,
  date: coralineDate,
  regex,
  colors: coralineColors,
};

export { consoleColor } from './lib/console-color.js';
export { errToString } from './lib/catch-error.js';
export const TG_GROUP_LOG = Number('-914836534');

export const withRetry = async <T>(fn: () => Promise<T>, { retries, retryIntervalMs }: RetryOptions): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    console.log(`WithRetry: Function fail, try again, error: ${errToString(err)}, retries: ${retries}`);
    await coraline.wait(retryIntervalMs);
    return withRetry(fn, {
      retries: retries - 1,
      retryIntervalMs,
    });
  }
};

export { temporaryDirectory, temporaryFile } from './lib/tempy.js';

export { parseSetCookieHeader } from './lib/cookie-parser.js';

export type { Cookie } from './lib/cookie-parser.js';

export default coraline;
