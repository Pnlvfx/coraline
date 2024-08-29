/* eslint-disable sonarjs/no-nested-functions */
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import { promises as fs } from 'node:fs';
import { isProduction } from './shared.js';
import { getUserAgent } from './user-agent.js';

export interface DownloadOptions {
  headers?: http.OutgoingHttpHeaders;
}

/** Download any file from a given url. */
export const download = async (media_url: string, outputDir: string, options?: DownloadOptions) => {
  const FileType = await import('file-type');
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

        const buffers: Buffer[] = [];

        res.on('data', (chunk: Buffer) => {
          buffers.push(chunk);
        });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        res.on('end', async () => {
          let filename = url.pathname.split('/').pop();
          if (!filename) {
            reject(new Error(`Unable to get the filename from this url: ${url.pathname}.`));
            return;
          }
          const fileBuffer = Buffer.concat(buffers);
          const fileType = await FileType.fileTypeFromBuffer(fileBuffer);
          if (!fileType) throw new Error('Unable to determine file type.');

          if (!filename.endsWith(fileType.ext)) {
            filename += `.${fileType.ext}`;
          }

          const output = path.join(outputDir, filename);
          await fs.writeFile(output, fileBuffer);
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
