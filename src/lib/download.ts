import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
const allowedFormats = /(jpg|jpeg|png|webp|avif|gif|svg|mov|mp4)$/i;

export const download = (
  media_url: string,
  outputPath: string,
  options?: {
    filename: string;
    timeout?: number;
  },
) => {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  return new Promise<string>((resolve, reject) => {
    const _url = new URL(media_url.endsWith('/') ? media_url.slice(0, -1) : media_url);
    let filename = options?.filename || path.basename(_url.pathname);
    filename = decodeURIComponent(filename).replaceAll(' ', '-');
    const fetcher = _url.protocol === 'https:' ? https : http;
    const request = fetcher
      .get(
        _url.href,
        { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux i686; rv:64.0) Gecko/20100101 Firefox/64.0', timeout: options?.timeout || 60_000 } },
        (res) => {
          res.on('error', (err) => {
            res.resume();
            reject(err);
          });
          if (res.statusCode === 302 && res.headers.location) {
            console.log('Request was redirected... Try with the new url...');
            download(res.headers.location, outputPath, options)
              .then((_) => resolve(_))
              .catch((err) => reject(err));
            return;
          } else if (res.statusCode !== 200) {
            res.resume();
            reject(`Download error: ${res.statusCode} ${res.statusMessage}`);
            return;
          }
          const format = res.headers['content-type']?.split('/').at(1)?.trim();
          if (!format) {
            res.resume();
            reject('This URL does not contain any media!');
            return;
          }

          if (!allowedFormats.test(format)) {
            res.resume();
            reject(`Invalid format "${format}", note that the page could be protected! ${res.statusCode} ${res.statusMessage}`);
            return;
          }

          if (filename.length > 20) {
            filename = filename.slice(-20);
          }

          const filenameFormat = path.extname(filename);

          if (!filenameFormat) {
            filename += `.${format}`;
          }

          const output = path.join(outputPath, filename);
          const fileStream = fs.createWriteStream(output);
          // res.on('data', (chunk) => {
          //   console.log(chunk.toString());
          // });
          res.pipe(fileStream);
          fileStream.on('error', (err) => {
            reject(err);
          });
          fileStream.on('finish', () => {
            fileStream.close();
            resolve(output);
          });
        },
      )
      .on('timeout', () => {
        request.destroy();
        reject('Request timed out');
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};