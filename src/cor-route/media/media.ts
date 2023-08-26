import coraline from '../..';
import coralineVideos from './videos';
import fs from 'node:fs';
import https from 'node:https';
import http from 'node:http';
import path from 'node:path';
import { promisify } from 'node:util';
import { buildMediaPath, buildMediaUrl } from '../../helpers';
import { CoralineMedia } from '../../types/image';

const coralineMedia = {
  videos: coralineVideos,
  getUrlFromPath: (folder: string) => {
    const extra_path = folder.split('/static/');
    return `${process.env.SERVER_URL}/static/${extra_path[1]}`;
  },
  getPathFromUrl: (url: string) => {
    const split = url.split('/static/');
    const pathArr = split[1].split('/');
    const filename = pathArr.pop();
    const base_path = coraline.useStatic(pathArr.join('/'));
    return `${base_path}/${filename}`;
  },
  saveAudio: async (audio: string | Uint8Array, output: string) => {
    const buffer = typeof audio === 'string' ? Buffer.from(audio, 'base64') : audio;
    const writeFile1 = promisify(fs.writeFile);
    await writeFile1(output, buffer, 'binary');
    return coraline.media.getUrlFromPath(output);
    // the output is already in the input so doesn't make sense to return the output
  },
  isImage: (string: string) => {
    return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(string);
  },
  isVideo: (string: string) => {
    return /\.(mp4|mov)$/i.test(string);
  },
  isMedia: (string: string) => {
    return /\.(jpg|jpeg|png|webp|avif|gif|svg|mp4|mov)$/.test(string);
  },
  useTempPath: (format: string) => {
    const regex = /\./;
    format = regex.test(format) ? format : `.${format}`;
    const folder = coraline.use('images/tmp');
    const id = coraline.generateRandomId(10);
    return `${folder}/${id}${format}`;
  },
  /**
   * @deprecated This method is deprecated, use download instead.
   */
  getMediaFromUrl: (media_url: string, public_id: string, type: 'videos' | 'images') => {
    return new Promise<CoralineMedia>((resolve, reject) => {
      const fetcher = new URL(media_url).protocol === 'https:' ? https : http;
      fetcher.get(media_url, { headers: { 'User-Agent': coraline.getUserAgent() } }, (res) => {
        if (res.statusCode === 302 && res.headers.location) {
          //redirect
          media_url = res.headers.location;
          coraline.media.getMediaFromUrl(media_url, public_id, type);
          return;
        }
        const format = res.headers['content-type']?.split('/')[1];
        if (!format) return reject('This URL does not contain any media!');
        const filename = buildMediaPath(public_id, type, format);
        const url = buildMediaUrl(public_id, type, format);
        const fileStream = fs.createWriteStream(filename);
        res.pipe(fileStream);
        fileStream.on('error', (err) => {
          const error = err as NodeJS.ErrnoException;
          if (error.code === 'ENOENT') {
            coraline.use(`/images/${public_id.split('/')[0]}`);
            coraline.media.getMediaFromUrl(url, public_id, type);
          } else {
            reject(err);
          }
        });
        fileStream.on('finish', () => {
          fileStream.close();
          resolve({ filename, url, format });
        });
      });
    });
  },
  download: (
    media_url: string,
    outputPath: string,
    options?: {
      filename: string;
    },
  ) => {
    // eslint-disable-next-line sonarjs/cognitive-complexity
    return new Promise<string>((resolve, reject) => {
      const _url = new URL(media_url);
      const fetcher = _url.protocol === 'https:' ? https : http;
      const request = fetcher
        .get(_url.href, { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux i686; rv:64.0) Gecko/20100101 Firefox/64.0' } }, (res) => {
          res.on('error', (err) => {
            res.resume();
            reject(err);
          });
          if (res.statusCode === 302 && res.headers.location) {
            //redirect
            console.log('Redirection');
            coraline.media
              .download(res.headers.location, outputPath, options)
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

          const allowedFormats = /(jpg|jpeg|png|webp|avif|gif|svg|mov|mp4)$/i;
          if (!allowedFormats.test(format)) {
            res.resume();
            reject(`Invalid format "${format}", note that the page could be protected! ${res.statusCode} ${res.statusMessage}`);
            return;
          }
          let filename = (options?.filename || _url.pathname.slice(_url.pathname.lastIndexOf('/') + 1)).trim().replaceAll(' ', '');

          if (filename.length > 20) {
            filename = filename.slice(0, 20);
          }

          const filenameFormat = path.extname(filename);
          filename = filename.replace(filenameFormat, '');
          filename += `.${format}`;

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
        })
        .on('timeout', () => {
          request.destroy();
          reject('Request timed out');
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  },
  getFileType: (filepath: string) => {
    const ext = path.extname(filepath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif') {
      return 'image';
    } else if (ext === '.mp4' || ext === '.avi' || ext === '.mkv' || ext === '.wmv') {
      return 'video';
    } else {
      return 'unknown';
    }
  },
  splitBySize: async (file: string, size: number) => {
    const { buffer } = await fs.promises.readFile(file);
    const promises = [];
    for (let i = 0; i < buffer.byteLength; i += size) {
      const chunk = buffer.slice(i, i + size);
      promises.push(fs.promises.writeFile(`${file}_part${i}.flac`, Buffer.from(chunk)));
    }
    await Promise.all(promises);
  },
};

export default coralineMedia;
