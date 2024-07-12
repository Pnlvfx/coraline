import { consoleColor, type ConsoleColor } from 'coraline-client';
import readline from 'node:readline';
import { isProduction } from './shared.js';

export interface ScriptOptions {
  title?: string;
  destroyAfter?: number;
  color?: ConsoleColor;
}

let isRunning = false;

export const createScriptExec = ({ title = 'Welcome! Press Enter to run your function.', destroyAfter, color = 'blue' }: ScriptOptions = {}) => {
  if (isProduction) throw new Error('Do not use coraline.createScriptExec in production as it is used only for debugging purposes.');
  if (isRunning) throw new Error('A script is already running. Please run one script at a time.');
  isRunning = true;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let timer: NodeJS.Timeout | undefined;
  return new Promise<string>((resolve, reject) => {
    const handleLine = (input: string) => {
      rl.removeListener('line', handleLine);
      rl.close();
      clearTimeout(timer);
      isRunning = false;
      resolve(input);
    };
    if (destroyAfter) {
      timer = setTimeout(() => {
        rl.removeListener('line', handleLine);
        rl.close();
        isRunning = false;
        reject(new Error('Script execution timed out.'));
      }, destroyAfter);
    }

    rl.on('line', handleLine);
    consoleColor(color, title);
    rl.prompt();
  });
};
