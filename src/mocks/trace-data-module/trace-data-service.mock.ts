import { TraceDataServiceInterface } from '../../types/trace-data-service.interface';

export type TraceMockDataType = {
  traceId: string;
  ip?: string;
  referrer?: string;
};

export class TraceDataServiceMock implements TraceDataServiceInterface {
  getRequestData(): TraceMockDataType {
    return {
      traceId: 'test-id',
      ip: '185.154.75.21',
      referrer: 'my-referrer.com/some/page.html',
    };
  }
}
