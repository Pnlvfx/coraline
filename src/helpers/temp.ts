import path from 'node:path';
import coraline from '../index.js';
import fs from 'node:fs';

const tempDir = coraline.use('tmp');
const getPath = (prefix = '') => path.join(tempDir, prefix + coraline.generateRandomId(10));

export const temporaryFile = ({ name, extension }: { name?: string; extension?: string }) => {
  if (name) {
    if (extension !== undefined && extension !== null) throw new Error('The `name` and `extension` options are mutually exclusive');
    return path.join(temporaryDirectory(), name);
  }
  return getPath() + (extension === undefined || extension === null ? '' : '.' + extension.replace(/^\./, ''));
};

export const temporaryDirectory = ({ prefix = '' } = {}) => {
  const directory = getPath(prefix);
  fs.mkdirSync(directory);
  return directory;
};