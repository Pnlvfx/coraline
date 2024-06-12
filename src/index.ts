import https from 'node:https';
import { URL } from 'node:url';
import os from 'node:os';
import client from 'coraline-client';
import { clearFolder, generateRandomId, readJSON, rm, saveFile, use, useStatic } from './lib/init.js';
import coralineMedia from './lib/media.js';
import { log } from './lib/log.js';
import cache from './lib/cache.js';
import { splitLongGptCommand } from './lib/gpt-command.js';
import { createScriptExec } from './lib/script.js';
import { findUnusedExports } from './lib/ts-unused-exports.cjs';
import psList from './ps-list/index.js';

const coraline = {
  ...client,
  isUrl: (input: string) => {
    try {
      return !!new URL(input);
    } catch {
      return false;
    }
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
  psList,
};

export default coraline;

export {
  type Callback,
  type ConsoleColor,
  type Cookie,
  type RetryOptions,
  backOff,
  consoleColor,
  errToString,
  parseSetCookieHeader,
  regex,
  withRetry,
  wait,
} from 'coraline-client';

export const TG_GROUP_LOG = Number('-914836534');

export { chatGPT } from './lib/vihanga-gpt.js';

export { temporaryDirectory, temporaryFile } from './lib/tempy.js';

export { getEntries } from './lib/entries.js';

export type { DownloadOptions } from './lib/download.js';
