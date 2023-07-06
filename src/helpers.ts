import path from 'node:path';
import fs from 'node:fs';
import coraline from './coraline';

const _path = process.cwd();
export const coraline_path = path.resolve(_path, '../coraline');
export const projectName = _path.split('/')[_path.split('/').length - 1].replace('api-', '').replace('api_', '');

export const coralinemkDir = (folder: string) => {
  fs.mkdir(folder, { recursive: true }, (err) => {
    if (err && err.code != 'EEXIST') throw new Error(err.message);
  });
  return folder;
};

export const buildMediaPath = (public_id: string, type: 'images' | 'videos', format: string) => {
  const split = public_id.split('/'); //split 1 is folder split[2] is the id
  const path = coraline.useStatic(`${type}/${split[0]}`);
  return `${path}/${split[1]}.${format}`;
};

export const buildMediaUrl = (public_id: string, type: 'images' | 'videos', format: string, w?: number, h?: number) => {
  if (!process.env.SERVER_URL) throw new Error('You need to add SERVER_URL to your env file!');
  const split = public_id.split('/');
  const url = `${process.env.SERVER_URL}/static/${type}/${split[0].toLowerCase()}/${split[1]}.${format}`;
  const query = `?w=${w}&h=${h}`;
  return w && h ? `${url}${query}` : url;
};

export const stringify = (data: unknown) => {
  if (typeof data === 'string') {
    return data;
  }
  return JSON.stringify(data);
};
