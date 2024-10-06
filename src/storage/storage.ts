import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { clearFolder } from '../lib/shared.js';

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
      await mkDir(path.join(folder, 'images'));
      await mkDir(path.join(folder, 'videos'));
      return folder;
    },
    clearAll: () => clearFolder(cwd),
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

export type Storage = Awaited<ReturnType<typeof storage>>;
