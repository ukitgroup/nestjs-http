export const httpServiceConfigMock = {
  enableTraceService: true,
  headersMap: {
    traceId: 'x-trace-id',
    ip: 'x-real-ip',
    userAgent: 'user-agent',
    referrer: 'referrer',
  },
  excludeHeaders: [],
};
