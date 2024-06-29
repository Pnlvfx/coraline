import { consoleColor, type ConsoleColor } from 'coraline-client';
import readline from 'node:readline';
import { isProduction } from './shared.js';

export interface ScriptOptions {
  title?: string;
  destroyAfter?: number;
  color?: ConsoleColor;
}

export const createScriptExec = ({ title = 'Welcome! Press Enter to run your function.', destroyAfter, color = 'blue' }: ScriptOptions = {}) => {
  if (isProduction) throw new Error('Do not use coraline.createScriptExec in production as it is used only for debugging purposes.');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let timer: NodeJS.Timeout | undefined;
  return new Promise<string>((resolve, reject) => {
    if (destroyAfter) {
      timer = setTimeout(() => {
        rl.removeListener('line', handleLine);
        rl.close();
        reject(new Error('Script execution timed out.'));
      }, destroyAfter);
    }

    const handleLine = (input: string) => {
      rl.removeListener('line', handleLine);
      rl.close();
      clearTimeout(timer);
      try {
        resolve(input);
      } catch (err) {
        reject(err);
      }
    };

    rl.on('line', handleLine);
    consoleColor(color, title);
    rl.prompt();
  });
};
