import path from 'node:path';
import fs from 'node:fs';
import { generateRandomId } from './shared.js';
import os from 'node:os';

type Extensions = 'mp4' | 'mp3' | 'mov' | 'png' | 'jpg' | 'jpeg' | 'txt' | 'html' | 'css';

const tempDir = fs.realpathSync(os.tmpdir());
const getPath = (prefix = '') => path.join(tempDir, prefix + generateRandomId(10));

export const temporaryFile = ({ name, extension }: { name?: string; extension?: Extensions }) => {
  if (name) {
    if (extension !== undefined) throw new Error('The `name` and `extension` options are mutually exclusive');
    return path.join(temporaryDirectory(), name);
  }
  return getPath() + (extension === undefined ? '' : '.' + extension.replace(/^\./, ''));
};

export const temporaryDirectory = ({ prefix = '' } = {}) => {
  const directory = getPath(prefix);
  fs.mkdirSync(directory);
  return directory;
};
