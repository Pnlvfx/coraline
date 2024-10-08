import os from 'node:os';

export const getUserAgent = () => {
  const system = os.platform();
  switch (system) {
    case 'darwin': {
      return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
    }
    case 'linux': {
      return `x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36`;
    }
    case 'win32': {
      const winVersion = os.release().split('.').at(0);
      if (!winVersion) throw new Error('Something went wrong while getting user agent.');
      return `Mozilla/5.0 (Windows NT ${winVersion}; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36`;
    }
    default: {
      return `Mozilla/5.0 (compatible; Node.js/${process.version}; ${process.platform} ${process.arch})`;
    }
  }
};
