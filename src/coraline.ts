import fs from 'node:fs/promises';
import client from 'coraline-client';
import { clearFolder, generateRandomId, readJSON, rm } from './lib/shared.js';
import { log, logToFile } from './lib/log.js';
import { cache } from './lib/cache.js';
import { splitLongGptCommand } from './lib/gpt-command.js';
import input from './lib/input.js';
import { psList } from './ps-list/ps-list.js';
import { storage } from './storage/storage.js';
import { wait } from './lib/wait.js';
import { benchmark } from './lib/benchmark.js';
import { getUserAgent } from './lib/user-agent.js';
import { download } from './lib/download.js';

const coraline = {
  ...client,
  wait,
  getUserAgent,
  rm,
  clearFolder,
  generateRandomId,
  readJSON,
  splitLongGptCommand,
  log,
  logToFile,
  cache,
  psList,
  storage,
  benchmark,
  download,
  input,
  getContentTypeFromUrl: async (url: string) => {
    const res = await fetch(url, { method: 'HEAD' });
    if (!res.ok) throw new Error(`Failed to retrieve content-type header: ${res.status.toString()}: ${res.statusText}`);
    const contentType = res.headers.get('content-type');
    if (!contentType) throw new Error('This url does not have a content-type value!');
    return contentType;
  },
  saveAudio: async (audio: string | Uint8Array | Buffer, output: string) => {
    const buffer = typeof audio === 'string' ? Buffer.from(audio, 'base64') : audio;
    await fs.writeFile(output, buffer, 'binary');
  },
  getVideoFileSize: async (url: string) => {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    if (!contentLength) throw new Error('Unable to determine file size. Content-Length header missing.');
    const fileSizeInBytes = Number.parseInt(contentLength, 10);
    return {
      bytes: Number(fileSizeInBytes.toFixed(2)),
      kilobytes: Number((fileSizeInBytes / 1024).toFixed(2)),
      megabytes: Number((fileSizeInBytes / (1024 * 1024)).toFixed(2)),
      gigabytes: Number((fileSizeInBytes / (1024 * 1024 * 1024)).toFixed(0)),
    };
  },
};

export default coraline;

export { consoleColor, errToString, regex, getEntries, getKeys, withRetry, type Callback, type ConsoleColor, type Cookie } from 'coraline-client';
export { temporaryDirectory, temporaryFile } from './lib/tempy.js';
export { temporaryDirectorySync, temporaryFileSync } from './lib/tempy-sync.js';
export { execAsync } from './lib/promisify.js';
export { findUnusedExports } from './lib/ts-unused-exports.js';
export type { DownloadOptions } from './lib/download.js';
export type { Cache } from './lib/cache.js';
