import { consoleColor, type ConsoleColor } from './console-color.js';
import readline from 'node:readline';
import { isProduction } from './init.js';

export interface ScriptOptions {
  title?: string;
  repeat?: boolean;
  destroyAfter?: number;
  color?: ConsoleColor;
}

let isRunning = false;

export const createScriptExec = <T>(
  callback: (input?: string) => T,
  { title = 'Welcome! Press Enter to run your function.', repeat = false, destroyAfter, color = 'blue' }: ScriptOptions = {},
) => {
  if (isProduction) throw new Error('Do not use coraline.createScriptExec in production as it is used only for debugging purposes.');
  if (isRunning) throw new Error('Make sure to call script execution only once at a time, otherwise multiple script could start together.');
  isRunning = true;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise<T>((resolve, reject) => {
    let timer: NodeJS.Timeout | undefined;
    if (destroyAfter) {
      timer = setTimeout(() => {
        isRunning = false;
        rl.close();
        reject(new Error('Script execution timed out.'));
      }, destroyAfter);
    }

    rl.on('line', async (input) => {
      clearTimeout(timer);
      try {
        const maybe = await callback(input);
        resolve(maybe);
      } catch (err) {
        reject(err);
      }
      if (repeat) {
        consoleColor(color, title);
        rl.prompt();
      } else {
        isRunning = false;
        rl.close();
      }
    });
    consoleColor(color, title);
    rl.prompt();
  });
};