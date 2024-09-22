import fs from 'node:fs/promises';

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
};

export default media;
