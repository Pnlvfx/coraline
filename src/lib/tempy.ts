import path from 'node:path';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import { generateRandomId } from './shared.js';

let tempDir: string | undefined;

const getTempDir = async () => {
  if (!tempDir) {
    tempDir = await fs.realpath(os.tmpdir());
  }
  return tempDir;
};

const getPath = async (prefix = '') => path.join(await getTempDir(), prefix + generateRandomId(10));

export const temporaryFile = async ({ name, extension }: { name?: string; extension?: string }) => {
  if (name) {
    if (extension) throw new Error('The `name` and `extension` options are mutually exclusive');
    return path.join(await temporaryDirectory(), name);
  }
  return (await getPath()) + (extension ? '.' + extension.replace(/^\./, '') : '');
};

export const temporaryDirectory = async ({ prefix = '' } = {}) => {
  const directory = await getPath(prefix);
  await fs.mkdir(directory);
  return directory;
};
