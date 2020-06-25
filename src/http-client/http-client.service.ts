import got, { Got, Options } from "got";
import { Inject, Optional } from "@nestjs/common";
import {
  GOT_INSTANCE,
  TRACE_DATA_SERVICE,
  TRACE_SERVICE_CONFIG
} from "./constants";
import { traceServiceOptsType } from "./http-client.config";

export class HttpClientService {
  constructor(
    @Inject(GOT_INSTANCE) private readonly gotInstance: Got = got,
    @Optional() @Inject(TRACE_DATA_SERVICE) private readonly traceDataService,
    @Optional()
    @Inject(TRACE_SERVICE_CONFIG)
    private readonly traceDataServiceOpts: traceServiceOptsType
  ) {}

  get(
    url: string,
    { clientOpts }: { clientOpts: Options } = { clientOpts: {} }
  ) {
    const { headers } = clientOpts;
    const traceHeaders = this.getHeaders();
    return this.gotInstance.get(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders }
    });
  }

  post(
    url: string,
    { clientOpts }: { clientOpts: Options } = { clientOpts: {} }
  ) {
    const { headers } = clientOpts;
    const traceHeaders = this.getHeaders();
    return this.gotInstance.post(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders }
    });
  }

  delete(
    url: string,
    { clientOpts }: { clientOpts: Options } = { clientOpts: {} }
  ) {
    const { headers } = clientOpts;
    const traceHeaders = this.getHeaders();
    return this.gotInstance.delete(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders }
    });
  }

  head(
    url: string,
    { clientOpts }: { clientOpts: Options } = { clientOpts: {} }
  ) {
    const { headers } = clientOpts;
    const traceHeaders = this.getHeaders();
    return this.gotInstance.head(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders }
    });
  }

  put(
    url: string,
    { clientOpts }: { clientOpts: Options } = { clientOpts: {} }
  ) {
    const { headers } = clientOpts;
    const traceHeaders = this.getHeaders();
    return this.gotInstance.put(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders }
    });
  }

  patch(
    url: string,
    { clientOpts }: { clientOpts: Options } = { clientOpts: {} }
  ) {
    const { headers } = clientOpts;
    const traceHeaders = this.getHeaders();
    return this.gotInstance.patch(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders }
    });
  }

  private extractTraceData() {
    return this.traceDataService.getRequestData();
  }

  private getHeaders() {
    if (!this.isTraceServiceExists) {
      return {};
    }
    const traceData = this.extractTraceData();

    const { headersMap, excludeHeaders } = this.traceDataServiceOpts;

    return Object.entries(headersMap).reduce((acc, [propName, headerName]) => {
      if (excludeHeaders.includes(headerName)) {
        return acc;
      }
      acc[headerName] = traceData[propName];
      return acc;
    }, {});
  }

  get isTraceServiceExists() {
    return this.traceDataServiceOpts && this.traceDataService;
  }
}
