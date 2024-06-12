import type { File } from '../types/file.js';
import path from 'node:path';
import { promises as fs, mkdir, PathLike } from 'node:fs';
import crypto from 'node:crypto';
import { checkPath } from './make-dir.js';

const directory = process.cwd();
const coraline_path = path.resolve(directory, '../.coraline');

const mkDir = (folder: string) => {
  checkPath(folder);
  mkdir(folder, { recursive: true }, (err) => {
    if (err && err.code != 'EEXIST') throw new Error(err.message);
  });
};

const basePath = directory.split('/').at(-1);
if (!basePath) throw new Error('Error uring coraline initialization: unsupported system!');
const projectName = basePath.replace('api-', '').replace('api_', '').trim().replaceAll(' ', '');

export const isProduction = process.env['NODE_ENV'] === 'production';

export const generateRandomId = (max = 10) => {
  return crypto.randomBytes(max / 2).toString('hex');
};

export const use = (document: string) => {
  const extra_path = path.join('gov', document);
  const isAbsolute = path.isAbsolute(extra_path);
  const folder = isAbsolute ? path.join(coraline_path, projectName, extra_path) : path.resolve(coraline_path, projectName, extra_path);
  mkDir(folder);
  return folder;
};

export const useStatic = (document?: string) => {
  const extra_path = document ? path.join('static', document) : 'static';
  const isAbsolute = path.isAbsolute(extra_path);
  const folder = isAbsolute ? path.join(coraline_path, projectName, extra_path) : path.resolve(coraline_path, projectName, extra_path);
  mkDir(folder);
  mkDir(path.join(folder, 'images'));
  mkDir(path.join(folder, 'videos'));
  return folder;
};

export const readJSON = async <T>(file: string): Promise<T> => {
  const data = await fs.readFile(file);
  return JSON.parse(data.toString());
};

export const saveFile = async (filename: PathLike | fs.FileHandle, file: File) => {
  try {
    await fs.writeFile(filename, file);
    await fs.chmod(filename.toString(), '777');
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code !== 'ENOENT') throw err;
    const folder = path.normalize(path.join(filename.toString(), '..'));
    const subfolder = folder
      .split(projectName + '/')
      .at(1)
      ?.split('/')
      .slice(1)
      .join('/');
    if (!subfolder) throw new Error('!');
    use(subfolder);
    await saveFile(filename, file);
  }
};

export const rm = async (files: string | string[]) => {
  const dieFiles = typeof files === 'string' ? [files] : files;
  for (const file of dieFiles) {
    try {
      await fs.rm(file, { recursive: true });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }
};

export const clearFolder = async (folder: string) => {
  const contents = await fs.readdir(folder);
  for (const content of contents) {
    await rm(path.join(folder, content));
  }
};
