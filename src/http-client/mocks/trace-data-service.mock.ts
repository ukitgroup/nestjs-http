import { TraceDataServiceInterface } from "../trace-data-service.interface";

export type TraceMockDataType = {
  traceId: string;
  ip?: string;
  referrer?: string;
};

export class TraceDataServiceMock implements TraceDataServiceInterface {
  private readonly requestData: TraceMockDataType;

  constructor() {
    this.requestData = {
      traceId: "test-id",
      ip: "185.154.75.21",
      referrer: "my-referrer.com/some/page.html"
    };
  }

  getRequestData() {
    return this.requestData;
  }
}
