import path from 'node:path';
import { promises as fs } from 'node:fs';
import crypto from 'node:crypto';

export const isProduction = process.env['NODE_ENV'] === 'production';

export const generateRandomId = (max = 10) => crypto.randomBytes(max / 2).toString('hex');

export const readJSON = async <T>(file: string): Promise<T> => {
  const data = await fs.readFile(file);
  return JSON.parse(data.toString()) as T;
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
