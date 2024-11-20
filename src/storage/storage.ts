import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { clearFolder, rm } from '../lib/shared.js';

let used = false;

/** @TODO even later, use a config to check what path exist and what should be created,
 * allow auto update if user delete folder from outside the node env and update the value to allow easy resolution.
 */

// interface StorageConfig {
//   cwd: string;
// }

// const getConfigs = async (cwd: string): Promise<StorageConfig> => {
//   const configFile = path.join(cwd, '.config');
//   try {
//     const buf = await fs.readFile(configFile);
//     return JSON.parse(buf.toString()) as StorageConfig;
//   } catch {
//     const configs = { cwd }; // add more initial configs here.
//     await fs.writeFile(configFile, JSON.stringify(configs));
//     return configs;
//   }
// };

export const storage = async (name: string) => {
  if (used) throw new Error('Do not use coraline.storage more than once.');
  const cwd = path.join(os.homedir(), '.coraline', name);
  // const configs = await getConfigs(cwd);
  await mkDir(cwd, true);
  used = true;
  return {
    cwd,
    use: async (internalPath: string) => {
      const directory = path.join(cwd, internalPath);
      await mkDir(directory);
      return directory;
    },
    useStatic: async () => {
      const folder = path.join(cwd, 'static');
      await mkDir(folder);
      const imagePath = path.join(folder, 'images');
      await mkDir(imagePath);
      const videoPath = path.join(folder, 'videos');
      await mkDir(videoPath);
      return { staticPath: folder, imagePath, videoPath };
    },
    getUrlFromStaticPath: (coraPath: string, query?: Record<string, string>) => {
      if (!process.env['SERVER_URL']) throw new Error('Please add SERVER_URL to your env file to use this function');
      const extra_path = coraPath.split('/static/').at(1);
      if (!extra_path) throw new Error(`Invalid path provided: ${coraPath} should contain a static path!`);
      const queryString = new URLSearchParams(query).toString();
      return `${process.env['SERVER_URL']}/static/${extra_path}${queryString ? '?' + queryString : ''}`;
    },
    getPathFromUrl: (url: string) => {
      const { pathname } = new URL(url);
      return path.join(cwd, pathname);
    },
    clearAll: () => clearFolder(cwd),
    reset: () => rm(cwd),
  };
};

/** @TODO Remove the try catch when the configs will be implemented, no need to skip eexist as config should know. */
const mkDir = async (folder: string, recursive?: boolean) => {
  checkPath(folder);
  try {
    await fs.mkdir(folder, { recursive });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code == 'EEXIST') return;
    throw err;
  }
};

const checkPath = (pth: string) => {
  if (process.platform === 'win32') {
    const pathHasInvalidWinCharacters = /["*:<>?|]/.test(pth.replace(path.parse(pth).root, ''));

    if (pathHasInvalidWinCharacters) {
      throw new Error(`Path contains invalid characters: ${pth}`);
    }
  }
};
