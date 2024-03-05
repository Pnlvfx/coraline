import type { Callback } from './types/shared.js';
import https from 'node:https';
import { URL } from 'node:url';
import os from 'node:os';
import { clearFolder, generateRandomId, isProduction, readJSON, rm, saveFile, use, useStatic, wait } from './lib/init.js';
import regex from './lib/regex.js';
import coralineDate from './lib/date.js';
import coralineMedia from './lib/media.js';
import coralineColors from './lib/colors.js';
import { log } from './lib/log.js';
import cache from './lib/cache.js';
import { splitLongGptCommand } from './lib/gpt-command.js';
import { createScriptExec } from './lib/script.js';
import { findUnusedExports } from './lib/ts-unused-exports.cjs';

const coraline = {
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
  findDuplicates: <T>(arr: T[]) => {
    const duplicates: T[] = [];
    for (const [index, item] of arr.entries()) {
      if (arr.includes(item, index + 1) && !duplicates.includes(item)) {
        // If the item appears again later in the array and is not already in the duplicates array
        duplicates.push(item);
      }
    }
    return duplicates;
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
      return !!new URL(input);
    } catch {
      return false;
    }
  },
  runAtSpecificTime: (hour: number, minute: number, fn: Callback<void>, repeat: boolean) => {
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
  performanceEnd: (start: number, api: string) => {
    if (isProduction) throw new Error('Do not use coraline.performanceEnd in production as it is used only for debugging purposes.');
    const end = performance.now();
    const time = `Api: ${api} took ${end - start} milliseconds`;
    // eslint-disable-next-line no-console
    return console.log(time);
  },
  memoryUsage: () => {
    if (isProduction) throw new Error('Do not use coraline.memoryUsage in production as it is used only for debugging purposes.');
    const used = process.memoryUsage().heapUsed;
    const total = process.memoryUsage().heapTotal;
    const percentage = Math.round((used / total) * 10_000) / 100;
    // eslint-disable-next-line no-console
    console.log(`Heap usage: ${percentage}%`);
    return { heapUsage: percentage };
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
  getUserAgent: () => {
    const system = os.platform();
    let userAgent = '';
    switch (system) {
      case 'darwin': {
        userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0`;
        break;
      }
      case 'linux': {
        userAgent = `Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0`;
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
  isJson: (res: Response) => res.headers.get('Content-Type')?.includes('application/json'),
  wait,
  createScriptExec,
  rm,
  clearFolder,
  generateRandomId,
  use,
  useStatic,
  saveFile,
  readJSON,
  splitLongGptCommand,
  log,
  findUnusedExports,
  cache,
  media: coralineMedia,
  date: coralineDate,
  regex,
  colors: coralineColors,
};
export default coraline;

export { consoleColor } from './lib/console-color.js';
export { errToString } from './lib/catch-error.js';
export const TG_GROUP_LOG = Number('-914836534');

export { chatGPT } from './lib/vihanga-gpt.js';

export { withRetry, type RetryOptions } from './lib/retry.js';

export { backOff } from './lib/exponential-backoff.js';

export { temporaryDirectory, temporaryFile } from './lib/tempy.js';

export { parseSetCookieHeader } from './lib/cookie-parser.js';

export type { Cookie } from './lib/cookie-parser.js';

export type { ConsoleColor } from './lib/console-color.js';

export { type Callback, getEntries } from './types/shared.js';

export type { DownloadOptions } from './lib/download.js';

export { default as regex } from './lib/regex.js';
