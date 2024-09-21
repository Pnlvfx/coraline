import type { TempDirParams } from './tempy.js';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { generateRandomId } from './shared.js';

const tempDir = fs.realpathSync(os.tmpdir());
const getPath = (prefix = '') => path.join(tempDir, prefix + generateRandomId(10));

export const temporaryFileSync = ({ name, extension }: TempDirParams) => {
  if (name) {
    return path.join(temporaryDirectorySync(), name);
  }
  return getPath() + (extension === undefined ? '' : '.' + extension.replace(/^\./, ''));
};

export const temporaryDirectorySync = ({ prefix = '' } = {}) => {
  const directory = getPath(prefix);
  fs.mkdirSync(directory);
  return directory;
};
