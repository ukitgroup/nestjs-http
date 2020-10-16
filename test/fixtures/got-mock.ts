import { RetryObject } from 'got';

export const calculateDelayMock = (obj: RetryObject) => obj.computedValue / 100;
