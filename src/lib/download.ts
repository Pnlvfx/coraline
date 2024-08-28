/* eslint-disable sonarjs/no-nested-functions */
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import { isProduction } from './shared.js';
import { getUserAgent } from './user-agent.js';

export interface DownloadOptions {
  headers?: http.OutgoingHttpHeaders;
}

/** Download any file from a given url. */
export const download = (media_url: string, outputDir: string, options?: DownloadOptions) => {
  const fetchOptions = {
    headers: {
      'User-Agent': getUserAgent(),
      ...options?.headers,
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
        const ext = res.headers['content-type']?.split('/').at(1)?.trim();
        if (!ext) {
          res.resume();
          reject(new Error(`Unable to get file type from ${url.href}!`));
          return;
        }

        const filename = url.pathname.split('/').pop();
        if (!filename) {
          reject(new Error('Unable to get filename from url.'));
          return;
        }

        if (!filename.endsWith(ext)) {
          reject(new Error('This is just to check if it happens, you can check what cause it and just add the ext at the end.'));
          return;
        }

        const output = path.join(outputDir, filename);
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
    run(media_url);
  });
};
