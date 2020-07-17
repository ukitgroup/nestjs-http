import { Test } from '@nestjs/testing';
import { httpServiceConfigMock } from '../../test/fixtures/config-module/config-module.config.mock';
import { HttpClient } from '../http-client.module';
import { HttpClientService } from '../http-client.service';

import { TraceDataServiceMock } from '../../test/fixtures/trace-data-module/trace-data-service.mock';
import { TraceDataServiceModuleMock } from '../../test/fixtures/trace-data-module/trace-data-module.mock';

import {
  HTTP_CLIENT_INSTANCE_GOT_OPTS,
  HTTP_CLIENT_ROOT_GOT_OPTS,
  TRACE_DATA_SERVICE,
  HTTP_CLIENT_SERVICE_CONFIG,
} from '../di-token-constants';

describe('HttpClient', () => {
  it('Test HttpService has all http methods', async () => {
    const methods = ['get', 'post', 'delete', 'head', 'put', 'patch'];
    const appModuleRef = await Test.createTestingModule({
      imports: [
        HttpClient.forRoot({
          imports: [TraceDataServiceModuleMock],
          providers: [
            {
              provide: TRACE_DATA_SERVICE,
              useClass: TraceDataServiceMock,
            },
          ],
        }),
      ],
    }).compile();

    const httpService = appModuleRef.get(HttpClientService);
    methods.forEach(method => {
      expect(httpService[method]).toBeInstanceOf(Function);
    });
  });

  it('Test HttpService without module opts', async () => {
    const appModuleRef = await Test.createTestingModule({
      imports: [
        HttpClient.forRoot({
          imports: [TraceDataServiceModuleMock],
          providers: [
            {
              provide: TRACE_DATA_SERVICE,
              useClass: TraceDataServiceMock,
            },
          ],
        }),
      ],
    }).compile();

    const { shouldTraceServiceInvoke } = appModuleRef.get(HttpClientService);
    expect(shouldTraceServiceInvoke).toBeFalsy();
  });

  it('Test enabling TraceService by config', async () => {
    const serviceConfigWithDisabledTraceService = {
      ...httpServiceConfigMock,
      enableTraceService: true,
    };
    const appModuleRef = await Test.createTestingModule({
      imports: [
        HttpClient.forRoot({
          imports: [TraceDataServiceModuleMock],
          providers: [
            {
              provide: TRACE_DATA_SERVICE,
              useClass: TraceDataServiceMock,
            },
            {
              provide: HTTP_CLIENT_SERVICE_CONFIG,
              useValue: serviceConfigWithDisabledTraceService,
            },
          ],
        }),
      ],
    }).compile();

    const { shouldTraceServiceInvoke } = appModuleRef.get(HttpClientService);
    expect(shouldTraceServiceInvoke).toBeTruthy();
  });

  it('Test for exception with enabled TraceService without passed one', async () => {
    const serviceConfigWithEnabledTraceService = {
      ...httpServiceConfigMock,
      enableTraceService: true,
    };
    const appModuleRef = await Test.createTestingModule({
      imports: [
        HttpClient.forRoot({
          imports: [TraceDataServiceModuleMock],
          providers: [
            {
              provide: HTTP_CLIENT_SERVICE_CONFIG,
              useValue: serviceConfigWithEnabledTraceService,
            },
          ],
        }),
      ],
    }).compile();

    const httpClientService = appModuleRef.get(HttpClientService);
    expect(function readGetter() {
      return httpClientService.shouldTraceServiceInvoke;
    }).toThrow();
  });

  it('Test applying default options for enabled TraceService, if there are not specified', async () => {
    const serviceConfigWithDisabledTraceService = { enableTraceService: true };
    const expectedConfig = {
      ...httpServiceConfigMock,
      enableTraceService: true,
    };
    const appModuleRef = await Test.createTestingModule({
      imports: [
        HttpClient.forRoot({
          imports: [TraceDataServiceModuleMock],
          providers: [
            {
              provide: HTTP_CLIENT_SERVICE_CONFIG,
              useValue: serviceConfigWithDisabledTraceService,
            },
          ],
        }),
      ],
    }).compile();

    const { serviceConfig } = appModuleRef.get(HttpClientService);
    expect(serviceConfig).toEqual(expectedConfig);
  });

  it('Test applying default options for enabled TraceService, if there are defined partially', async () => {
    const serviceConfigWithDisabledTraceService = {
      headersMap: {
        traceId: 'x-trace-id',
      },
      enableTraceService: true,
    };
    const expectedConfig = {
      ...httpServiceConfigMock,
      enableTraceService: true,
    };
    const appModuleRef = await Test.createTestingModule({
      imports: [
        HttpClient.forRoot({
          imports: [TraceDataServiceModuleMock],
          providers: [
            {
              provide: HTTP_CLIENT_SERVICE_CONFIG,
              useValue: serviceConfigWithDisabledTraceService,
            },
          ],
        }),
      ],
    }).compile();

    const { serviceConfig } = appModuleRef.get(HttpClientService);
    expect(serviceConfig).toEqual(expectedConfig);
  });

  it('Test merge options between forRoot and forInstance', async () => {
    await Test.createTestingModule({
      imports: [
        HttpClient.forRoot({
          providers: [
            {
              provide: HTTP_CLIENT_ROOT_GOT_OPTS,
              useValue: { timeout: 999, retry: 5 },
            },
          ],
        }),
      ],
    }).compile();

    const innerModuleRef = await Test.createTestingModule({
      imports: [
        HttpClient.forInstance({
          providers: [
            {
              provide: HTTP_CLIENT_INSTANCE_GOT_OPTS,
              useValue: { retry: 10 },
            },
          ],
        }),
      ],
    }).compile();

    const { clientOpts } = innerModuleRef.get(HttpClientService);
    expect(clientOpts.retry.limit).toEqual(10);
    expect(clientOpts.timeout.request).toEqual(999);
  });

  it('Test http service applying between forRoot init and forInstance', async () => {
    await Test.createTestingModule({
      imports: [
        HttpClient.forRoot({
          providers: [
            {
              provide: HTTP_CLIENT_SERVICE_CONFIG,
              useValue: httpServiceConfigMock,
            },
          ],
        }),
      ],
    }).compile();

    const innerModuleRef = await Test.createTestingModule({
      imports: [HttpClient.forInstance({})],
    }).compile();

    const { serviceConfig } = innerModuleRef.get(HttpClientService);

    expect(serviceConfig).toEqual(httpServiceConfigMock);
  });
});
