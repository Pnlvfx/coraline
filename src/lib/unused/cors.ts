/* eslint-disable sonarjs/no-commented-code */
import { networkInterfaces } from 'node:os';

export const getLocalIPv4 = () => {
  const networks = networkInterfaces();
  for (const key of Object.keys(networks)) {
    if (key === 'en0') {
      const localNetworks = networks[key];
      if (!localNetworks) throw new Error('Missing network.');
      const ipv4 = localNetworks.find((a) => a.family === 'IPv4');
      return ipv4?.address;
    }
  }
  throw new Error('Ip not found.');
};

// export const getCorsOrigin = () => {
//   if (config.NODE_ENV === 'production') return config.CLIENT_URL;
//   if (config.CLIENT_URL.includes('localhost')) {
//     const ip = getLocalIPv4();
//     return [config.CLIENT_URL, `http://${ip}:3000`];
//   }
//   return ['http://localhost:3000', config.CLIENT_URL];
// };
