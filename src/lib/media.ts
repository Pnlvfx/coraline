import { promises as fs } from 'node:fs';
import path from 'node:path';
import { download } from './download.js';

const media = {
  getUrlFromPath: (directory: string, query?: Record<string, string>) => {
    if (!process.env['SERVER_URL']) throw new Error('Please add SERVER_URL to your env file to use this function');
    const extra_path = directory.split('/static/').at(1);
    if (!extra_path) throw new Error(`Invalid path provided: ${directory}!`);
    const queryString = new URLSearchParams(query).toString();
    return `${process.env['SERVER_URL']}/static/${extra_path}${queryString ? '?' + queryString : ''}`;
  },
  getPathFromUrl: (url: string) => {
    const _url = new URL(url);
    const [_, ...segments] = _url.pathname.split('/static/');
    const folder = segments.join('/').split('/');
    const filename = folder.pop();
    return { folder, filename };
  },
  saveAudio: async (audio: string | Uint8Array | Buffer, output: string) => {
    const buffer = typeof audio === 'string' ? Buffer.from(audio, 'base64') : audio;
    await fs.writeFile(output, buffer, 'binary');
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
    const { buffer } = await fs.readFile(file);
    const promises = [];
    for (let i = 0; i < buffer.byteLength; i += size) {
      const chunk = buffer.slice(i, i + size);
      promises.push(fs.writeFile(`${file}_part${i.toString()}.flac`, Buffer.from(chunk)));
    }
    await Promise.all(promises);
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
  download,
};

export default media;
