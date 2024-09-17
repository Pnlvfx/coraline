import https from 'node:https';
import client from 'coraline-client';
import { clearFolder, generateRandomId, readJSON, rm } from './lib/shared.js';
import media from './lib/media.js';
import { log } from './lib/log.js';
import cache from './lib/cache.js';
import { splitLongGptCommand } from './lib/gpt-command.js';
import input from './lib/input.js';
import psList from './ps-list/ps-list.js';
import { findUnusedExports } from './lib/ts-unused-exports.cjs';
import { storage } from './storage/storage.js';
import { wait } from './lib/wait.js';
import { benchmark } from './lib/benchmark.js';
import { getUserAgent } from './lib/user-agent.js';
import { download } from './lib/download.js';

const coraline = {
  ...client,
  wait,
  getContentType: (url: string) => {
    return new Promise<string>((resolve, reject) => {
      https
        .request(url, { method: 'HEAD' }, (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`Failed to retrieve video: ${res.statusCode?.toString() ?? ''} ${res.statusMessage?.toString() ?? ''}`));
            return;
          }
          const contentType = res.headers['content-type'];
          if (!contentType) {
            reject(new Error('This url does not have a content-type value!'));
            return;
          }
          resolve(contentType);
        })
        .on('error', reject)
        .end();
    });
  },
  getUserAgent,
  input,
  rm,
  clearFolder,
  generateRandomId,
  readJSON,
  splitLongGptCommand,
  log,
  cache,
  psList,
  findUnusedExports,
  storage,
  benchmark,
  download,
  media,
};

export default coraline;

export {
  type Callback,
  type ConsoleColor,
  type Cookie,
  type RetryOptions,
  consoleColor,
  errToString,
  regex,
  getEntries,
  getKeys,
} from 'coraline-client';

export { temporaryDirectory, temporaryFile } from './lib/tempy.js';

export { execAsync } from './lib/exec-async.js';

export type { DownloadOptions } from './lib/download.js';

export type { Storage } from './storage/storage.js';
