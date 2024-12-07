/* eslint-disable sonarjs/no-redundant-optional */
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { generateRandomId } from './shared.js';

let tempDir: string | undefined;

interface TempDirNameParams {
  name: string;
  extension?: undefined;
}

interface TempDirExtParams {
  name?: undefined;
  extension: string;
}

export type TempDirParams = TempDirNameParams | TempDirExtParams;

const getTempDir = async () => {
  if (!tempDir) {
    tempDir = await fs.realpath(os.tmpdir());
  }
  return tempDir;
};

const getPath = async (prefix = '') => path.join(await getTempDir(), prefix + generateRandomId());

export const temporaryFile = async ({ name, extension }: TempDirParams) => {
  if (name) {
    return path.join(await temporaryDirectory(), name);
  }
  return (await getPath()) + (extension ? '.' + extension.replace(/^\./, '') : '');
};

export const temporaryDirectory = async ({ prefix = '' } = {}) => {
  const directory = await getPath(prefix);
  await fs.mkdir(directory);
  return directory;
};
