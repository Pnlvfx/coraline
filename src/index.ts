import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { generateRandomId, projectName, use, useStatic } from './helpers/init.js';
import regex from './helpers/regex.js';
import coralineDate from './helpers/date.js';
import coralineMedia from './helpers/media.js';
import coralineColors from './helpers/colors.js';
import { inspect } from 'node:util';
import readline from 'node:readline';
import { URL } from 'node:url';
import { RetryOptions } from './types';
import os from 'node:os';
import { File } from './types/file';
import { errToString } from './helpers/catch-error.js';
const fsPromises = fs.promises;

const coraline = {
  // eslint-disable-next-line no-unused-vars
  wait: (ms: number, callback?: () => Promise<void>) => {
    return new Promise<void>((resolve, reject) =>
      setTimeout(() => {
        if (callback) {
          callback().then(resolve).catch(reject);
        } else {
          resolve();
        }
      }, ms),
    );
  },
  // eslint-disable-next-line no-unused-vars
  createScriptExec: (fn: (input?: string) => unknown, title = 'Welcome! Press Enter to run your function.') => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.on('line', async (input) => {
      await fn(input);
      console.log(`\u001B[34m${title}\u001B[0m`);
      rl.prompt();
    });
    console.log(`\u001B[34m${title}\u001B[0m`);
    rl.prompt();
  },
  arrayMove: (arr: [], fromIndex: number, toIndex: number) => {
    const element = arr[fromIndex];
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
  shuffleArray: (array: unknown[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  },
  createPermalink: (text: string) => {
    return text.trim().replaceAll(' ', '_').replaceAll(/\W/g, '').toLowerCase().replaceAll('__', '_').slice(0, 50).trimEnd();
  },
  use,
  useStatic,
  saveFile: async (filename: fs.PathLike | fs.promises.FileHandle, file: File) => {
    try {
      await fsPromises.writeFile(filename, file);
      await fsPromises.chmod(filename.toString(), '777');
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === 'ENOENT') {
        const folder = path.normalize(path.join(filename.toString(), '..'));
        const subfolder = folder
          .split(projectName + '/')[1]
          .split('/')
          .slice(1)
          .join('/');
        use(subfolder);
        await coraline.saveFile(filename, file);
      } else {
        throw err;
      }
    }
  },
  readJSON: async <T>(file: string) => {
    const _find = await fsPromises.readFile(file);
    return JSON.parse(_find.toString()) as T;
  },
  isUrl: (text: string) => {
    try {
      // eslint-disable-next-line no-new
      new URL(text);
      return true;
    } catch {
      return false;
    }
  },
  rm: async (files: string | string[]) => {
    const dieFiles = typeof files === 'string' ? [files] : files;
    for (const file of dieFiles) {
      try {
        await fsPromises.rm(file, { recursive: true });
      } catch (err) {
        const error = err as NodeJS.ErrnoException;
        if (error.code !== 'ENOENT') throw err;
      }
    }
    return true;
  },
  clearFolder: async (folder: string) => {
    const contents = await fsPromises.readdir(folder);
    for (const content of contents) {
      const curPath = path.join(folder, content);
      await coraline.rm(curPath);
    }
  },
  runAtSpecificTime: (hour: number, minute: number, fn: () => Promise<void>, repeat: boolean) => {
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    date.setSeconds(0);

    // If the scheduled time has already passed for today, schedule it for tomorrow or stop it

    if (date < new Date()) {
      if (repeat) {
        date.setDate(date.getDate() + 1);
      } else {
        return;
      }
    }

    const timeUntilFunction = date.getTime() - Date.now();
    console.log(`new Timeout added at ${coralineDate.toYYMMDDHHMM(date)}`);
    setTimeout(async () => {
      await fn();
      if (repeat) {
        await coraline.wait(1 * 60 * 1000);
        coraline.runAtSpecificTime(hour, minute, fn, true);
      }
    }, timeUntilFunction);
  },
  generateRandomId,
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
    console.log(`File size: ${fileSizeInMB.toFixed(2)} MB`);
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
  media: coralineMedia,
  date: coralineDate,
  regex,
  colors: coralineColors,
};

export { consoleColor } from './helpers/console-color.js';
export { errToString } from './helpers/catch-error.js';
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

export { temporaryDirectory, temporaryFile } from './helpers/tempy.js';

export default coraline;
