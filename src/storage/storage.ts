import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { clearFolder, rm } from '../lib/shared.js';

let used = false;

export const storage = async (name: string) => {
  if (used) throw new Error('Do not use coraline.storage more than once.');
  const cwd = path.join(os.homedir(), '.coraline', name);
  await mkDir(cwd, true);
  used = true;
  return {
    use: async (directory: string) => {
      const isAbsolute = path.isAbsolute(directory);
      const folder = isAbsolute ? path.join(cwd, directory) : path.resolve(cwd, directory);
      await mkDir(folder);
      return folder;
    },
    useStatic: async () => {
      const folder = path.join(cwd, 'static');
      await mkDir(folder);
      const imagePath = path.join(folder, 'images');
      await mkDir(imagePath);
      const videoPath = path.join(folder, 'videos');
      await mkDir(videoPath);
      return { staticPath: folder, imagePath, videoPath };
    },
    getUrlFromPath: (directory: string, query?: Record<string, string>) => {
      if (!process.env['SERVER_URL']) throw new Error('Please add SERVER_URL to your env file to use this function');
      const extra_path = directory.split('/static/').at(1);
      if (!extra_path) throw new Error(`Invalid path provided: ${directory} should contain a static path!`);
      const queryString = new URLSearchParams(query).toString();
      return `${process.env['SERVER_URL']}/static/${extra_path}${queryString ? '?' + queryString : ''}`;
    },
    getPathFromUrl: (url: string) => {
      const { pathname } = new URL(url);
      return path.join(cwd, pathname);
    },
    clearAll: () => clearFolder(cwd),
    reset: () => rm(cwd),
  };
};

const mkDir = async (folder: string, recursive?: boolean) => {
  checkPath(folder);
  try {
    await fs.mkdir(folder, { recursive });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code == 'EEXIST') return;
    throw err;
  }
};

const checkPath = (pth: string) => {
  if (process.platform === 'win32') {
    const pathHasInvalidWinCharacters = /["*:<>?|]/.test(pth.replace(path.parse(pth).root, ''));

    if (pathHasInvalidWinCharacters) {
      throw new Error(`Path contains invalid characters: ${pth}`);
    }
  }
};
