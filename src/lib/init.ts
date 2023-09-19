import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { checkPath } from './make-dir.js';

const directory = process.cwd();
const coraline_path = path.resolve(directory, '../.coraline');

const coralinemkDir = (folder: string) => {
  checkPath(folder);
  fs.mkdir(folder, { recursive: true }, (err) => {
    if (err && err.code != 'EEXIST') throw new Error(err.message);
  });
  return folder;
};

const basePath = directory.split('/').at(-1);
if (!basePath) throw new Error('Error uring coraline initialization!');

export const projectName = basePath.replace('api-', '').replace('api_', '').trim().replaceAll(' ', '');

export const generateRandomId = (max = 10) => {
  return crypto.randomBytes(max / 2).toString('hex');
};

export const use = (document: string) => {
  const extra_path = path.join('gov', document);
  const isAbsolute = path.isAbsolute(extra_path);
  const folder = isAbsolute ? path.join(coraline_path, projectName, extra_path) : path.resolve(coraline_path, projectName, extra_path);
  return coralinemkDir(folder);
};

export const useStatic = (document?: string) => {
  const extra_path = document ? path.join('static', document) : 'static';
  const isAbsolute = path.isAbsolute(extra_path);
  const folder = isAbsolute ? path.join(coraline_path, projectName, extra_path) : path.resolve(coraline_path, projectName, extra_path);
  return coralinemkDir(folder);
};
