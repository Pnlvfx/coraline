import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const directory = process.cwd();
const coraline_path = path.resolve(directory, '../.coraline');

const coralinemkDir = (folder: string) => {
  fs.mkdir(folder, { recursive: true }, (err) => {
    if (err && err.code != 'EEXIST') throw new Error(err.message);
  });
  return folder;
};

export const projectName = directory.split('/')[directory.split('/').length - 1].replace('api-', '').replace('api_', '').trim().replaceAll(' ', '');

export const generateRandomId = (max = 10) => {
  return crypto.randomBytes(max / 2).toString('hex');
};

export const use = (document: string) => {
  const isStatic = document.match('images') || document.match('videos') ? true : false;
  const subFolder = isStatic ? 'static' : 'gov';
  const extra_path = path.join(subFolder, document);
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

export const buildMediaPath = (public_id: string, type: 'images' | 'videos', format: string) => {
  const split = public_id.split('/'); //split 1 is folder split[2] is the id
  const path = useStatic(`${type}/${split[0]}`);
  return `${path}/${split[1]}.${format}`;
};

export const buildMediaUrl = (public_id: string, type: 'images' | 'videos', format: string, w?: number, h?: number) => {
  if (!process.env['SERVER_URL']) throw new Error('You need to add SERVER_URL to your env file!');
  const split = public_id.split('/');
  const url = `${process.env['SERVER_URL']}/static/${type}/${split[0].toLowerCase()}/${split[1]}.${format}`;
  const query = `?w=${w}&h=${h}`;
  return w && h ? `${url}${query}` : url;
};
