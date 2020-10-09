import got, { Got } from 'got';
import { Inject, Optional } from '@nestjs/common';
import { GOT_INSTANCE, TRACE_DATA_SERVICE } from './di-token-constants';
import { ServiceConfigType, HttpClientOptionsType } from './types/config.types';
import { TraceDataServiceInterface } from './types/trace-data-service.interface';
import { HttpServiceConfigProvider } from './http-service-config.provider';

export class HttpClientService {
  private readonly clientConfig: ServiceConfigType;

  constructor(
    @Inject(GOT_INSTANCE) private readonly gotInstance: Got = got,
    @Optional()
    @Inject(TRACE_DATA_SERVICE)
    private readonly traceDataService: TraceDataServiceInterface,
    private readonly httpServiceConfigProvider: HttpServiceConfigProvider,
  ) {
    this.clientConfig = this.httpServiceConfigProvider.getConfig();
  }

  get(
    url: string,
    { clientOpts }: { clientOpts: HttpClientOptionsType } = { clientOpts: {} },
  ) {
    const { headers } = clientOpts;
    const traceHeaders = this.getHeaders();
    return this.gotInstance.get(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders },
    });
  }

  post(
    url: string,
    { clientOpts }: { clientOpts: HttpClientOptionsType } = { clientOpts: {} },
  ) {
    const { headers } = clientOpts;
    const traceHeaders = this.getHeaders();
    return this.gotInstance.post(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders },
    });
  }

  delete(
    url: string,
    { clientOpts }: { clientOpts: HttpClientOptionsType } = { clientOpts: {} },
  ) {
    const { headers } = clientOpts;
    const traceHeaders = this.getHeaders();
    return this.gotInstance.delete(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders },
    });
  }

  head(
    url: string,
    { clientOpts }: { clientOpts: HttpClientOptionsType } = { clientOpts: {} },
  ) {
    const { headers } = clientOpts;
    const traceHeaders = this.getHeaders();
    return this.gotInstance.head(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders },
    });
  }

  put(
    url: string,
    { clientOpts }: { clientOpts: HttpClientOptionsType } = { clientOpts: {} },
  ) {
    const { headers } = clientOpts;
    const traceHeaders = this.getHeaders();
    return this.gotInstance.put(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders },
    });
  }

  patch(
    url: string,
    { clientOpts }: { clientOpts: HttpClientOptionsType } = { clientOpts: {} },
  ) {
    const { headers } = clientOpts;
    const traceHeaders = this.getHeaders();
    return this.gotInstance.patch(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders },
    });
  }

  private getHeaders() {
    if (!this.shouldTraceServiceInvoke) {
      return {};
    }
    const traceData = this.traceDataService.getRequestData();

    const { headersMap, excludeHeaders } = this.clientConfig;

    return Object.entries(headersMap).reduce((acc, [propName, headerName]) => {
      if (excludeHeaders.includes(headerName)) {
        return acc;
      }
      acc[headerName] = traceData[propName];
      return acc;
    }, {});
  }

  get shouldTraceServiceInvoke() {
    if (this.clientConfig.enableTraceService && !this.traceDataService) {
      throw new Error(
        "You had enabled usage of TraceDataService, but didn't passed it",
      );
    }
    return this.clientConfig.enableTraceService && this.traceDataService;
  }

  get clientOpts() {
    return this.gotInstance.defaults.options;
  }

  get serviceConfig() {
    return this.clientConfig;
  }
}
