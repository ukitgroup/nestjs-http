import { TraceDataType } from './trace-data-service.type';

export interface TraceDataServiceInterface {
  getRequestData(): TraceDataType;
}
