import os from 'node:os';

// GET THE LATEST FROM:
// https://www.whatismybrowser.com/guides/the-latest-user-agent/chrome

export const getUserAgent = () => {
  const system = os.platform();
  switch (system) {
    case 'darwin': {
      return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
    }
    case 'linux': {
      return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36`;
    }
    default: {
      return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
    }
  }
};
