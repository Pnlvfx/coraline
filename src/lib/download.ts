import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import { isProduction } from './shared.js';

const allowedFormats = /(jpg|jpeg|png|webp|avif|gif|svg|mov|mp4|mpeg)$/i;

const getFilename = (url: URL, format: string, options?: DownloadOptions) => {
  const name = options?.filename || path.basename(url.pathname);
  const filenameFormat = path.extname(options?.filename || url.pathname);
  let filename = decodeURIComponent(name).replaceAll(' ', '-').toLowerCase().trim();
  const maxLength = options?.filenameLength || 80;

  if (filename.length > maxLength) {
    filename = filename.slice(0, maxLength);
  }

  if (!filenameFormat || filenameFormat !== format) {
    filename += `.${format === 'mpeg' ? 'mp3' : format}`;
  }
  return filename;
};

export interface DownloadOptions {
  filename?: string;
  filenameLength?: number;
  timeout?: number;
  headers?: http.OutgoingHttpHeaders;
}

export const download = (media_url: string, outputDir: string, options?: DownloadOptions) => {
  const fetchOptions = {
    headers: options?.headers || {
      'User-Agent': 'Mozilla/5.0 (X11; Linux i686; rv:64.0) Gecko/20100101 Firefox/64.0',
      timeout: options?.timeout || 60_000,
    },
  };
  return new Promise<string>((resolve, reject) => {
    const run = (urlStr: string) => {
      const url = new URL(urlStr);
      const fetcher = (url.protocol === 'https:' ? https : http).get;
      const req = fetcher(url.href, fetchOptions, (res) => {
        res.on('error', (err) => {
          res.resume();
          reject(err);
        });
        if (res.statusCode === 302 || res.statusCode === 301) {
          if (!res.headers.location || res.headers.location === url.href) {
            res.resume();
            reject(`Request at ${url.href} has invalid redirect url!`);
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
          reject(`Download error for this url ${url.href}: ${res.statusCode} ${res.statusMessage}`);
          return;
        }
        const format = res.headers['content-type']?.split('/').at(1)?.trim();
        if (!format || !allowedFormats.test(format)) {
          res.resume();
          reject(`The URL ${url.href} does not contain any media or it has an invalid format! Format: ${format}`);
          return;
        }

        const filename = getFilename(url, format, options);

        const output = path.join(outputDir, filename);
        const fileStream = fs.createWriteStream(output);
        res.pipe(fileStream);
        fileStream.on('error', async (err) => {
          const error = err as NodeJS.ErrnoException;
          if (error.code === 'ENOENT') {
            await fs.promises.mkdir(outputDir, { recursive: true });
            run(media_url);
            return;
          }
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
        .on('error', (err) => {
          reject(err);
        });
    };
    run(media_url);
  });
};
