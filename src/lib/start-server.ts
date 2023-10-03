#!/usr/bin/env node
import nodemon from 'nodemon';
let isRunning = false;

export interface ServerOptions {
  start: () => void | Promise<void>;
  close: () => void | Promise<void>;
}

export const startServer = async (script: string, options?: ServerOptions) => {
  if (isRunning) throw new Error('Make sure to call startGptServer only once!');
  if (process.env['NODE_ENV'] === 'production') throw new Error('Do not use this script in production');
  isRunning = true;

  if (options?.start) {
    await options.start();
  }

  const closeWrap = async () => {
    try {
      if (options?.close) {
        await options.close();
      }
    } catch (err) {
      console.log('An error occured while closing the server:', err);
    }
  };

  nodemon({
    script,
    ext: 'js',
    exec: `node`,
  })
    .on('start', () => {
      console.log('The application has started.!');
    })
    .on('quit', async () => {
      closeWrap();
      console.log('Application quit');
      process.exit(0);
    })
    .on('crash', async (...args) => {
      closeWrap();
      console.log('CRASH:', ...args);
      process.exit(1);
    });
};
