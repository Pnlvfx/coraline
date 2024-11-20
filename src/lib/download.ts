import os from 'node:os';
import fs from 'node:fs';
import { getUserAgent } from './user-agent.js';
import path from 'node:path';
import mime from 'mime-types';
import { errToString } from 'coraline-client';
import { pipeline } from 'node:stream/promises';
import { isProduction } from './shared.js';

export interface DownloadOptions {
  directory?: string;
  headers?: HeadersInit;
}

const defaultHeaders = {
  'user-agent': getUserAgent(),
};

/** Download a file from a given url. */
export const download = (url: string, { headers = defaultHeaders, directory = path.join(os.homedir(), 'Downloads') }: DownloadOptions = {}) => {
  return new Promise<string>((resolve, reject) => {
    const handle = async (urlStr: string) => {
      try {
        const res = await fetch(urlStr, { headers });
        if (!res.ok) reject(new Error(`${res.status.toString()}: ${res.statusText}`));
        switch (res.status) {
          case 301:
          case 302: {
            const location = res.headers.get('location');
            if (!location) {
              reject(new Error(`Request at ${url} has invalid redirect URL!`));
              return;
            }
            if (!isProduction) {
              // eslint-disable-next-line no-console
              console.log(`Request at ${url} was redirected to ${location}...`);
            }
            void handle(location);
            break;
          }
          default: {
            if (res.ok) {
              if (!res.body) {
                reject(new Error(`Request at ${url} has no content to download.`));
                return;
              }
              const filename = getFilename(urlStr, res.headers);
              const output = path.join(directory, filename);
              const fileStream = fs.createWriteStream(output);
              await pipeline(res.body, fileStream);
              resolve(filename);
            } else {
              reject(new Error(`Download error for this url ${urlStr}: ${res.status.toString()} ${res.statusText.toString()}`));
            }
          }
        }
      } catch (err) {
        reject(err instanceof Error ? err : new Error(errToString(err)));
      }
    };

    void handle(url);
  });
};

const getFilename = (url: string, headers: Headers) => {
  const filenameFromContentDisposition = getFileNameFromContentDisposition(headers.get('content-disposition'));
  if (filenameFromContentDisposition) return filenameFromContentDisposition;
  if (path.extname(url)) return path.basename(url);
  const filenameFromContentType = getFileNameFromContentType(url, headers.get('content-type'));
  if (filenameFromContentType) return filenameFromContentType;
  throw new Error(
    "Unable to provide a filename for this url. Please provide a filename yourself or feel free to report an issue, and we'll try to address it.",
  );
};

const filenameRegex = /filename[^\n;=]*=((["']).*?\2|[^\n;]*)/;

const getFileNameFromContentDisposition = (contentDisposition: string | null) => {
  if (!contentDisposition?.includes('filename=')) return;
  const match = filenameRegex.exec(contentDisposition)?.at(1);
  return match?.replace(/["']/g, '');
};

const getFileNameFromContentType = (url: string, contentType: string | null) => {
  if (!contentType) return;
  const extension = mime.extension(contentType);
  if (!extension) return;
  const withoutExt = removeExtension(path.basename(url));
  return `${withoutExt}.${extension}`;
};

const removeExtension = (str: string) => {
  const arr = str.split('.');
  if (arr.length === 1) return str;
  return arr.slice(0, -1).join('.');
};
