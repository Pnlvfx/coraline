/* eslint-disable unicorn/prefer-ternary */
export { consoleColor } from './cor-route/console-color';
export { errToString } from './cor-route/catch-error';
export const TG_GROUP_LOG = Number('-914836534');
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { coraline_path, coralinemkDir, projectName, stringify } from './helpers';
import regex from './cor-route/regex';
import coralineDate from './cor-route/date';
import crypto from 'node:crypto';
import coralineMedia from './cor-route/media/media';
import coralineColors from './cor-route/colors';
import { inspect } from 'node:util';
import readline from 'node:readline';
import { URL } from 'node:url';
import { RetryOptions } from './types';
import os from 'node:os';

const fsPromises = fs.promises;

export const withRetry = async <T>(fn: () => Promise<T>, { retries, retryIntervalMs }: RetryOptions): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) {
      throw err;
    }
    console.log('WithRetry: Function fail, try again', { retries });
    await coraline.wait(retryIntervalMs);
    return withRetry(fn, {
      retries: retries - 1,
      retryIntervalMs,
    });
  }
};

const coraline = {
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
  createScriptExec: (fn: () => unknown) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.on('line', async (input) => {
      if (input.trim() === '') {
        await fn();
        console.log('\u001B[34mPress Enter to run your function.\u001B[0m');
        rl.prompt();
      }
    });
    console.log('\u001B[34mWelcome! Press Enter to run your function.\u001B[0m');
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
  createPermalink: (text: string) => {
    let permalink = text.trim().replaceAll(' ', '_');
    permalink = permalink.replaceAll(/\W/g, '').toLowerCase().slice(0, 50).trimEnd();
    return permalink;
  },
  use: (document: string) => {
    const isStatic = document.match('images') || document.match('videos') ? true : false;
    const subFolder = isStatic ? 'static' : 'gov';
    const extra_path = path.join(subFolder, document);
    const isAbsolute = path.isAbsolute(extra_path);
    const folder = isAbsolute ? path.join(coraline_path, projectName, extra_path) : path.resolve(coraline_path, projectName, extra_path);
    return coralinemkDir(folder);
  },
  useStatic: (document?: string) => {
    const extra_path = document ? path.join('static', document) : 'static';
    const isAbsolute = path.isAbsolute(extra_path);
    const folder = isAbsolute ? path.join(coraline_path, projectName, extra_path) : path.resolve(coraline_path, projectName, extra_path);
    return coralinemkDir(folder);
  },
  saveFile: async (filename: string, file: unknown) => {
    try {
      const string = stringify(file);
      await fsPromises.writeFile(filename, string);
      await fsPromises.chmod(filename, '777');
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === 'ENOENT') {
        const folder = path.normalize(path.join(filename, '..'));
        const subfolder = folder
          .split(projectName + '/')[1]
          .split('/')
          .slice(1)
          .join('/');
        coraline.use(subfolder);
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
  delete: async (filename: string) => {
    try {
      await fsPromises.rm(filename, { recursive: true });
      return true;
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === 'ENOENT') return true;
      throw err;
    }
  },
  clearFolder: async (folder: string) => {
    const contents = await fsPromises.readdir(folder);
    for (const content of contents) {
      const curPath = path.join(folder, content);
      await coraline.delete(curPath);
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
    console.log(`new Timeout added at ${coraline.date.toYYMMDDHHMM(date)}`);
    setTimeout(async () => {
      await fn();
      if (repeat) {
        await coraline.wait(1 * 60 * 1000);
        coraline.runAtSpecificTime(hour, minute, fn, true);
      }
    }, timeUntilFunction);
  },
  generateRandomId: (max: number) => {
    return crypto.randomBytes(max / 2).toString('hex');
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

export default coraline;
