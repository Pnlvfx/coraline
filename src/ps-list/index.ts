/* eslint-disable unicorn/prefer-module */
import type { ProcessDescriptor, ProcessDescriptorInternal } from './types/index.js';
import process from 'node:process';
import { promisify } from 'node:util';
import path from 'node:path';
import childProcess from 'node:child_process';

interface Options {
  all?: boolean;
}

interface EmptyObject {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const TEN_MEGABYTES = 1000 * 1000 * 10;
const execFile = promisify(childProcess.execFile);

const windows = async (): Promise<ProcessDescriptor[]> => {
  let binary;
  switch (process.arch) {
    case 'x64': {
      binary = 'fastlist-0.3.0-x64.exe';
      break;
    }
    case 'ia32': {
      binary = 'fastlist-0.3.0-x86.exe';
      break;
    }
    default: {
      throw new Error(`Unsupported architecture: ${process.arch}`);
    }
  }

  const binaryPath = path.join(__dirname, 'vendor', binary);
  const { stdout } = await execFile(binaryPath, {
    maxBuffer: TEN_MEGABYTES,
    windowsHide: true,
  });

  return stdout
    .trim()
    .split('\r\n')
    .map((line) => line.split('\t'))
    .map(([pid, ppid, name]) => {
      if (!pid || !ppid || !name) {
        return {
          pid: 0,
          ppid: 0,
          name: 'INVALID',
        };
      }
      return {
        pid: Number.parseInt(pid, 10),
        ppid: Number.parseInt(ppid, 10),
        name,
      };
    });
};

const nonWindowsMultipleCalls = async (options: Options = {}): Promise<ProcessDescriptor[]> => {
  const flags = (options.all === false ? '' : 'a') + 'wwxo';
  const returnValue: EmptyObject = {};

  await Promise.all(
    ['comm', 'args', 'ppid', 'uid', '%cpu', '%mem'].map(async (cmd) => {
      const { stdout } = await execFile('ps', [flags, `pid,${cmd}`], { maxBuffer: TEN_MEGABYTES });

      for (let line of stdout.trim().split('\n').slice(1)) {
        line = line.trim();
        const [pid] = line.split(' ', 1);
        if (pid) {
          const value = line.slice(pid.length + 1).trim();

          if (returnValue[pid] === undefined) {
            returnValue[pid] = {};
          }

          returnValue[pid][cmd] = value;
        }
      }
    }),
  );

  // Filter out inconsistencies as there might be race
  // issues due to differences in `ps` between the spawns
  return Object.entries(returnValue)
    .filter(([, value]) => value.comm && value.args && value.ppid && value.uid && value['%cpu'] && value['%mem'])
    .map(([key, value]) => ({
      pid: Number.parseInt(key, 10),
      name: path.basename(value.comm),
      cmd: value.args,
      ppid: Number.parseInt(value.ppid, 10),
      uid: Number.parseInt(value.uid, 10),
      cpu: Number.parseFloat(value['%cpu']),
      memory: Number.parseFloat(value['%mem']),
    }));
};

const ERROR_MESSAGE_PARSING_FAILED = 'ps output parsing failed';

const psOutputRegex = /^[\t ]*(?<pid>\d+)[\t ]+(?<ppid>\d+)[\t ]+(?<uid>[\d-]+)[\t ]+(?<cpu>\d+\.\d+)[\t ]+(?<memory>\d+\.\d+)[\t ]+(?<comm>.*)?/;

const nonWindowsCall = async (options: Options = {}): Promise<ProcessDescriptor[]> => {
  const flags = options.all === false ? 'wwxo' : 'awwxo';

  const psPromises = [
    execFile('ps', [flags, 'pid,ppid,uid,%cpu,%mem,comm'], { maxBuffer: TEN_MEGABYTES }),
    execFile('ps', [flags, 'pid,args'], { maxBuffer: TEN_MEGABYTES }),
  ];

  const promises = await Promise.all(psPromises);

  const [psLines, psArgsLines] = promises.map(({ stdout }) => stdout.trim().split('\n'));

  const psPids = new Set(psPromises.map((promise) => promise.child.pid));

  if (psLines) {
    psLines.shift();
  }

  const processCmds: EmptyObject = {};

  if (psArgsLines) {
    psArgsLines.shift();
    for (const line of psArgsLines) {
      const [pid] = line.trim().split(' ');
      if (pid) {
        // processCmds[pid] = (cmds as any).join(' '); // THIS IS BUGGED AND WILL FAIL // Array.isArray(cmds) ? cmds.join(' ') : cmds;
        throw new Error('Is the bug!');
      }
    }
  }

  // eslint-disable-next-line unicorn/prefer-ternary
  if (psLines) {
    return psLines
      .map((line) => {
        const match = psOutputRegex.exec(line);
        if (!match || !match.groups) throw new Error(ERROR_MESSAGE_PARSING_FAILED);
        const { pid, ppid, uid, cpu, memory, comm } = match.groups;
        const response: Partial<ProcessDescriptorInternal> = {};
        if (pid) {
          response.pid = Number.parseInt(pid, 10);
          response.cmd = processCmds[pid];
        }
        if (ppid) {
          response.ppid = Number.parseInt(ppid, 10);
        }
        if (uid) {
          response.uid = Number.parseInt(uid, 10);
        }
        if (cpu) {
          response.cpu = Number.parseInt(cpu, 10);
        }
        if (memory) {
          response.memory = Number.parseFloat(memory);
        }
        if (comm) {
          response.name = path.basename(comm);
        }
        return response as ProcessDescriptor;
      })
      .filter((processInfo) => !psPids.has(processInfo.pid));
  } else return [];
};

const nonWindows = async (options = {}) => {
  try {
    return await nonWindowsCall(options);
  } catch {
    // If the error is not a parsing error, it should manifest itself in multicall version too.
    return nonWindowsMultipleCalls(options);
  }
};

const psList = process.platform === 'win32' ? windows : nonWindows;

export default psList;
