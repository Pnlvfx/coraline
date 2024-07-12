import { consoleColor, type ConsoleColor } from 'coraline-client';
import readline from 'node:readline';
import { isProduction } from './shared.js';

export interface ScriptOptions {
  title?: string;
  color?: ConsoleColor;
}

let isRunning = false;

export const input = ({ title = "Welcome! I'm coraline input.", color = 'blue' }: ScriptOptions = {}) => {
  if (isProduction) throw new Error('Do not use coraline.input in production.');
  if (isRunning) throw new Error('Please use one input at a time.');
  isRunning = true;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const abort = () => {
    if (!isRunning) throw new Error("Calling abort while script it's not running");
    rl.removeAllListeners();
    rl.close();
    isRunning = false;
  };

  return {
    read: () => {
      return new Promise<string>((resolve, reject) => {
        const handleLine = (input: string) => {
          rl.off('line', handleLine);
          rl.close();
          isRunning = false;
          resolve(input);
        };

        rl.on('line', handleLine);

        rl.on('close', () => {
          rl.off('line', handleLine);
          reject(new Error('Aborted.'));
        });

        consoleColor(color, title);
        rl.prompt();
      });
    },
    abort,
  };
};
