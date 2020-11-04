import { Got, Options, Headers, Response, CancelableRequest } from 'got';
import { Inject, Optional } from '@nestjs/common';
import { GOT_INSTANCE, TRACE_DATA_SERVICE } from './di-token-constants';
import { ServiceConfigType } from './types/config.types';
import { TraceDataServiceInterface } from './types/trace-data-service.interface';
import { HttpServiceConfigProvider } from './http-service-config.provider';
import { HttpServiceConfigProviderInterface } from './http-service-config-provider.interface';

export class HttpClientService {
  private readonly clientConfig: ServiceConfigType;

  constructor(
    @Inject(GOT_INSTANCE) private readonly gotInstance: Got,
    @Optional()
    @Inject(TRACE_DATA_SERVICE)
    private readonly traceDataService: TraceDataServiceInterface,
    @Inject(HttpServiceConfigProvider)
    private readonly httpServiceConfigProvider: HttpServiceConfigProviderInterface,
  ) {
    this.clientConfig = this.httpServiceConfigProvider.getConfig();
  }

  get<T = unknown>(
    url: string,
    clientOpts: Options = {},
  ): CancelableRequest<Response<T>> {
    const { headers } = clientOpts;
    const traceHeaders: Headers = this.getHeaders();
    return this.gotInstance.get(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders },
    }) as CancelableRequest<Response<T>>;
  }

  post<T = unknown>(
    url: string,
    clientOpts: Options = {},
  ): CancelableRequest<Response<T>> {
    const { headers } = clientOpts;
    const traceHeaders = this.getHeaders();
    return this.gotInstance.post(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders },
    }) as CancelableRequest<Response<T>>;
  }

  delete<T = unknown>(
    url: string,
    clientOpts: Options = {},
  ): CancelableRequest<Response<T>> {
    const { headers } = clientOpts;
    const traceHeaders = this.getHeaders();
    return this.gotInstance.delete(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders },
    }) as CancelableRequest<Response<T>>;
  }

  head<T = unknown>(
    url: string,
    clientOpts: Options = {},
  ): CancelableRequest<Response<T>> {
    const { headers } = clientOpts;
    const traceHeaders = this.getHeaders();
    return this.gotInstance.head(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders },
    }) as CancelableRequest<Response<T>>;
  }

  put<T = unknown>(
    url: string,
    clientOpts: Options = {},
  ): CancelableRequest<Response<T>> {
    const { headers } = clientOpts;
    const traceHeaders = this.getHeaders();
    return this.gotInstance.put(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders },
    }) as CancelableRequest<Response<T>>;
  }

  patch<T = unknown>(
    url: string,
    clientOpts: Options = {},
  ): CancelableRequest<Response<T>> {
    const { headers } = clientOpts;
    const traceHeaders = this.getHeaders();
    return this.gotInstance.patch(url, {
      ...clientOpts,
      headers: { ...headers, ...traceHeaders },
    }) as CancelableRequest<Response<T>>;
  }

  private getHeaders() {
    if (!this.shouldTraceServiceInvoke) {
      return {};
    }
    const traceData = this.traceDataService.getRequestData();

    const { headersMap } = this.clientConfig;

    return Object.entries(headersMap).reduce((acc, [propName, headerName]) => {
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
    return !!(this.clientConfig.enableTraceService && this.traceDataService);
  }

  get clientOpts() {
    return this.gotInstance.defaults.options;
  }

  get serviceConfig() {
    return this.clientConfig;
  }
}
