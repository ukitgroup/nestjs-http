import { RetryObject } from 'got';

export const calculateDelayMock = (obj: RetryObject) =>
  obj.attemptCount >= obj.retryOptions.limit ? 0 : 10;
