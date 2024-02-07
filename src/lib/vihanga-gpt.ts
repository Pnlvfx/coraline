import { promises as fs } from 'node:fs';
import { errToString } from './catch-error.js';
import { wait } from './init.js';
import { temporaryFile } from './tempy.js';

const BASE_URL = 'https://vihangayt.me/tools/chatgpt';
const MIN_TIMEOUT = 25_000;
let timeout = false;

interface GPTResponse {
  status: boolean;
  owner: string;
  data?: string;
}

const Version = {
  '01': undefined,
  '02': 2,
  '03': 3,
  '04': 4,
  '05': 5,
};

const triggerTimeout = () => setTimeout(() => (timeout = false), MIN_TIMEOUT);

const vihangaYt = async (q: string, version: keyof typeof Version = '04') => {
  const query = new URLSearchParams({ q });
  if (timeout) await wait(MIN_TIMEOUT);
  timeout = true;
  triggerTimeout();
  const url = version === '01' ? BASE_URL : `${BASE_URL}${Version[version]}`;
  const res = await fetch(`${url}?${query.toString()}`);
  const isJson = res.headers.get('Content-Type')?.includes('application/json');
  if (!isJson) throw new Error(`${res.status}: ${res.statusText}`);
  const data: GPTResponse = await res.json();
  if (!data.status) throw new Error(data.data);
  if (!data.data) throw new Error('No response received from chat-gpt!');
  return data.data;
};

const getJSON = <T>(q: string) => {
  try {
    const startIdx = q.indexOf('{');
    const endIdx = q.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) throw new Error('No JSON found!');
    return JSON.parse(q.slice(startIdx, endIdx + 1)) as T;
  } catch (err) {
    const tmpFile = temporaryFile({ extension: 'json' });
    fs.writeFile(tmpFile, q);
    throw new Error(`Invalid JSON string received: ${errToString(err)}, check: ${tmpFile} to find the wrong request`);
  }
};

export const chatGPT = {
  prompt: vihangaYt,
  getJSON,
  Version,
};
