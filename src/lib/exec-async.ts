import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const _execAsync = promisify(exec);

export const execAsync = async (command: string) => {
  const { stderr, stdout } = await _execAsync(command);
  if (stderr) throw new Error(stderr);
  return stdout;
};
