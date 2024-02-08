import { consoleColor, type ConsoleColor } from './console-color.js';
import readline from 'node:readline';
import { isProduction } from './init.js';

export interface ScriptOptions {
  title?: string;
  repeat?: boolean;
  destroyAfter?: number;
  color?: ConsoleColor;
}

export const createScriptExec = <T>(
  callback: (input?: string) => T,
  { title = 'Welcome! Press Enter to run your function.', repeat = false, destroyAfter, color = 'blue' }: ScriptOptions = {},
) => {
  if (isProduction) throw new Error('Do not use coraline.createScriptExec in production as it is used only for debugging purposes.');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let timer: NodeJS.Timeout | undefined;
  return new Promise<T>((resolve, reject) => {
    if (destroyAfter) {
      timer = setTimeout(() => {
        rl.removeListener('line', handleLine);
        rl.close();
        reject(new Error('Script execution timed out.'));
      }, destroyAfter);
    }

    const handleLine = async (input: string) => {
      rl.removeListener('line', handleLine);
      rl.close();
      clearTimeout(timer);
      try {
        const maybe = await callback(input);
        resolve(maybe);
      } catch (err) {
        reject(err);
      }
      if (repeat) {
        createScriptExec(callback, { title, repeat, destroyAfter, color });
      }
    };

    rl.on('line', handleLine);
    consoleColor(color, title);
    rl.prompt();
  });
};
