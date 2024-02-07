import type { Range } from '../types/shared.js';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import { isProduction } from './init.js';
const allowedFormats = /(jpg|jpeg|png|webp|avif|gif|svg|mov|mp4|mpeg)$/i;

export const download = (
  media_url: string,
  outputDir: string,
  options?: {
    filename?: string;
    filenameLength?: Range<0, 256>;
    timeout?: number;
    headers?: http.OutgoingHttpHeaders;
  },
) => {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  return new Promise<string>((resolve, reject) => {
    const url = new URL(media_url);
    let filename = decodeURIComponent(options?.filename || path.basename(url.pathname)).replaceAll(' ', '-');
    const fetcher = (url.protocol === 'https:' ? https : http).get;
    const fetchOptions = {
      headers: options?.headers || {
        'User-Agent': 'Mozilla/5.0 (X11; Linux i686; rv:64.0) Gecko/20100101 Firefox/64.0',
        timeout: options?.timeout || 60_000,
      },
    };
    const request = fetcher(url.href, fetchOptions, (res) => {
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
        download(res.headers.location, outputDir, options)
          .then((_) => resolve(_))
          .catch((err) => reject(err));
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

      const maxLength = options?.filenameLength || 80;

      if (filename.length > maxLength) {
        filename = filename.slice(-maxLength);
      }

      const filenameFormat = path.extname(filename);

      if (!filenameFormat) {
        filename += `.${format === 'mpeg' ? 'mp3' : format}`;
      }

      const output = path.join(outputDir, filename);
      const fileStream = fs.createWriteStream(output);
      res.pipe(fileStream);
      fileStream.on('error', (err) => {
        const error = err as NodeJS.ErrnoException;
        if (error.code === 'ENOENT') {
          fs.promises
            .mkdir(outputDir, { recursive: true })
            .then(() => {
              download(url.href, outputDir, options)
                .then((_) => resolve(_))
                .catch((err) => reject(err));
            })
            .catch((err) => reject(err));
        } else reject(`Filestream error with url ${url.href}: ${err}`);
      });
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(output);
      });
    })
      .on('timeout', () => {
        request.destroy();
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};
