import http from 'http';
import https from 'https';
import { Options } from 'got';

export const gotConfigDefaults: Options = {
  agent: {
    http: new http.Agent({ keepAlive: true }),
    https: new https.Agent({ keepAlive: true }),
  },
};
