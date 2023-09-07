import coralineVideos from './videos.js';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { useStatic } from './init.js';
import { download } from './download.js';

const coralineMedia = {
  videos: coralineVideos,
  getUrlFromPath: (folder: string, query?: Record<string, string>) => {
    if (!process.env['SERVER_URL']) throw new Error('Please add SERVER_URL to your env file to use this function');
    const extra_path = folder.split('/static/').at(1);
    if (!extra_path) throw new Error('Invalid path!');
    const queryString = new URLSearchParams(query).toString();
    return `${process.env['SERVER_URL']}/static/${extra_path}${queryString ? '?' + queryString : ''}`;
  },
  getPathFromUrl: (url: string) => {
    const _url = new URL(url);
    let segments = _url.pathname.split('/static/');
    segments.shift();
    segments = segments.join('/').split('/');
    const filename = segments.pop();
    const base_path = useStatic(segments.join('/'));
    return `${base_path}/${filename}`;
  },
  saveAudio: async (audio: string | Uint8Array, output: string) => {
    const buffer = typeof audio === 'string' ? Buffer.from(audio, 'base64') : audio;
    const writeFile1 = promisify(fs.writeFile);
    await writeFile1(output, buffer, 'binary');
    return coralineMedia.getUrlFromPath(output);
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
  download,
};

export default coralineMedia;
