import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { checkPath } from './make-dir.js';
import { File } from '../types/file.js';
import readline from 'node:readline';

const directory = process.cwd();
const coraline_path = path.resolve(directory, '../.coraline');

const mkDir = (folder: string) => {
  checkPath(folder);
  fs.mkdir(folder, { recursive: true }, (err) => {
    if (err && err.code != 'EEXIST') throw new Error(err.message);
  });
};

const basePath = directory.split('/').at(-1);
if (!basePath) throw new Error('Error uring coraline initialization: unsupported system!');
const projectName = basePath.replace('api-', '').replace('api_', '').trim().replaceAll(' ', '');

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
  return folder;
};

export const readJSON = async <T>(file: string): Promise<T> => {
  const data = await fs.promises.readFile(file);
  return JSON.parse(data.toString());
};

export const saveFile = async (filename: fs.PathLike | fs.promises.FileHandle, file: File) => {
  try {
    await fs.promises.writeFile(filename, file);
    await fs.promises.chmod(filename.toString(), '777');
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === 'ENOENT') {
      const folder = path.normalize(path.join(filename.toString(), '..'));
      const subfolder = folder
        .split(projectName + '/')
        .at(1)
        ?.split('/')
        .slice(1)
        .join('/');
      if (!subfolder) throw new Error('You really mess up this time!');
      use(subfolder);
      await saveFile(filename, file);
    } else throw err;
  }
};

// eslint-disable-next-line no-unused-vars
export const createScriptExec = (fn: (input?: string) => unknown, title = 'Welcome! Press Enter to run your function.') => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.on('line', async (input) => {
    await fn(input);
    console.log(`\u001B[34m${title}\u001B[0m`);
    rl.prompt();
  });
  console.log(`\u001B[34m${title}\u001B[0m`);
  rl.prompt();
};
