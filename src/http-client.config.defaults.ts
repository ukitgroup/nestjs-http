import { ServiceConfigType } from './types/config.types';

export const httpServiceConfigDefaults: ServiceConfigType = {
  enableTraceService: false,
  headersMap: {
    traceId: 'x-trace-id',
    ip: 'x-real-ip',
    userAgent: 'user-agent',
    referrer: 'referrer',
  },
  excludeHeaders: [],
};
