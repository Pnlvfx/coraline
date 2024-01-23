import coraline from 'coraline';

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

export const vihangaYt = async (q: string, version: keyof typeof Version = '04') => {
  const query = new URLSearchParams({ q });
  if (timeout) await coraline.wait(MIN_TIMEOUT);
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
