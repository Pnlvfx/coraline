import path from 'node:path';
import os from 'node:os';
import { promises as fs } from 'node:fs';
import { checkPath } from '../lib/make-dir.js';

export const storage = async (name: string) => {
  const directory = path.join(os.homedir(), '.coraline', name);
  await mkDir(directory);
  return {
    use: async (document: string) => {
      const isAbsolute = path.isAbsolute(document);
      const folder = isAbsolute ? path.join(directory, document) : path.resolve(directory, document);
      await mkDir(folder);
      return folder;
    },
    useStatic: async (document?: string) => {
      const extra_path = document ? path.join('static', document) : 'static';
      const isAbsolute = path.isAbsolute(extra_path);
      const folder = isAbsolute ? path.join(directory, extra_path) : path.resolve(directory, extra_path);
      await mkDir(folder);
      await mkDir(path.join(folder, 'images'));
      await mkDir(path.join(folder, 'videos'));
      return folder;
    },
  };
};

const mkDir = async (folder: string) => {
  checkPath(folder);
  try {
    await fs.mkdir(folder);
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code == 'EEXIST') return;
    throw err;
  }
};

export type Storage = Awaited<ReturnType<typeof storage>>;
