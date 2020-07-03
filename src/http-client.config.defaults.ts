export const httpServiceConfigDefaults = {
  enableTraceService: false,
  headersMap: {
    traceId: 'x-trace-id',
    ip: 'x-real-ip',
    userAgent: 'user-agent',
    referrer: 'referrer',
  },
  excludeHeaders: [],
};
