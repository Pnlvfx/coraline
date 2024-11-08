/* eslint-disable sonarjs/no-redundant-optional */
/* eslint-disable sonarjs/no-nested-functions */
import https from 'node:https';
import os from 'node:os';
import http from 'node:http';
import fs from 'node:fs';
import { isProduction } from './shared.js';
import { getUserAgent } from './user-agent.js';
import path from 'node:path';
import mime from 'mime-types';

interface FilenameOption {
  /** Using filename can lead to issues as you have to provide the correct file extension. Use this only when you know it.   */
  filename?: string;
  directory?: undefined;
}

interface DirOption {
  /** Using filename can lead to issues as you have to provide the correct file extension. Use this only when you know it.   */
  filename?: undefined;
  directory: string;
}

export type SafeDirOption = FilenameOption | DirOption;

export type DownloadOptions = SafeDirOption & {
  headers?: http.OutgoingHttpHeaders;
};

const defaultHeaders = {
  'user-agent': getUserAgent(),
};

/** Download a file from a given url. */
export const download = (
  url: string,
  { headers = defaultHeaders, directory = path.join(os.homedir(), 'Downloads'), filename }: DownloadOptions = {},
) => {
  return new Promise<string>((resolve, reject) => {
    const run = (urlStr: string) => {
      const url = new URL(urlStr);
      const fetcher = (url.protocol === 'https:' ? https : http).get;
      const req = fetcher(url.href, { headers }, (res) => {
        res.on('error', (err) => {
          res.resume();
          reject(err);
        });
        if (res.statusCode === 302 || res.statusCode === 301) {
          if (!res.headers.location || res.headers.location === url.href) {
            res.resume();
            reject(new Error(`Request at ${url.href} has invalid redirect url!`));
            return;
          }
          if (!isProduction) {
            // eslint-disable-next-line no-console
            console.log(`Request was redirected to ${res.headers.location}...`);
          }
          run(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`Download error for this url ${url.href}: ${res.statusCode?.toString() ?? ''} ${res.statusMessage?.toString() ?? ''}`));
          return;
        }

        if (!filename) {
          filename = getFilename(url.origin + url.pathname, res.headers);
        }

        const output = path.join(directory, filename);
        const fileStream = fs.createWriteStream(output);
        res.pipe(fileStream);

        fileStream.on('error', (err) => {
          fileStream.close();
          reject(err);
        });

        fileStream.on('finish', () => {
          fileStream.close();
          resolve(output);
        });
      })
        .on('timeout', () => {
          req.destroy();
        })
        .on('error', reject);
    };
    run(url);
  });
};

const getFilename = (url: string, headers: http.IncomingHttpHeaders) => {
  const filenameFromContentDisposition = getFileNameFromContentDisposition(headers['content-disposition']);
  if (filenameFromContentDisposition) return filenameFromContentDisposition;
  if (path.extname(url)) return path.basename(url);
  const filenameFromContentType = getFileNameFromContentType(url, headers['content-type']);
  if (filenameFromContentType) return filenameFromContentType;
  throw new Error(
    "Unable to provide a filename for this url. Please provide a filename yourself or feel free to report an issue, and we'll try to address it.",
  );
};

const filenameRegex = /filename[^\n;=]*=((["']).*?\2|[^\n;]*)/;

const getFileNameFromContentDisposition = (contentDisposition?: string) => {
  if (!contentDisposition?.includes('filename=')) return;
  const match = filenameRegex.exec(contentDisposition)?.at(1);
  return match?.replace(/["']/g, '');
};

const getFileNameFromContentType = (url: string, contentType?: string) => {
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
