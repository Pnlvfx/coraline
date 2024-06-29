import path from 'node:path';
import os from 'node:os';
import { checkPath } from '../lib/make-dir.js';
import { mkdir } from 'node:fs';

const mkDir = (folder: string) => {
  checkPath(folder);
  mkdir(folder, { recursive: true }, (err) => {
    if (err && err.code != 'EEXIST') throw new Error(err.message);
  });
};

export const storage = (name: string) => {
  const directory = path.join(os.homedir(), '.coraline', name);
  return {
    use: (document: string) => {
      const extra_path = path.join('gov', document);
      const isAbsolute = path.isAbsolute(extra_path);
      const folder = isAbsolute ? path.join(directory, extra_path) : path.resolve(directory, extra_path);
      mkDir(folder);
      return folder;
    },
    useStatic: (document?: string) => {
      const extra_path = document ? path.join('static', document) : 'static';
      const isAbsolute = path.isAbsolute(extra_path);
      const folder = isAbsolute ? path.join(directory, extra_path) : path.resolve(directory, extra_path);
      mkDir(folder);
      mkDir(path.join(folder, 'images'));
      mkDir(path.join(folder, 'videos'));
      return folder;
    },
  };
};

export type CoralineStorage = ReturnType<typeof storage>;
