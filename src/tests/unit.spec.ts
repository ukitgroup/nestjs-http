import { Test } from '@nestjs/testing';
import { httpServiceConfigMock } from '../../test/fixtures/config-module/config-module.config.mock';
import { HttpClient } from '../http-client.module';
import { HttpClientService } from '../http-client.service';

import { TraceDataServiceMock } from '../../test/fixtures/trace-data-module/trace-data-service.mock';
import { TraceDataServiceModuleMock } from '../../test/fixtures/trace-data-module/trace-data-module.mock';
import {
  GOT_CONFIG,
  HTTP_SERVICE_CONFIG,
  TRACE_DATA_SERVICE,
} from '../public-di-token.constants';

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
        HttpClient.forInstance(),
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
        HttpClient.forInstance(),
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
              provide: HTTP_SERVICE_CONFIG,
              useValue: serviceConfigWithDisabledTraceService,
            },
          ],
        }),
        HttpClient.forInstance(),
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
              provide: HTTP_SERVICE_CONFIG,
              useValue: serviceConfigWithEnabledTraceService,
            },
          ],
        }),
        HttpClient.forInstance(),
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
              provide: HTTP_SERVICE_CONFIG,
              useValue: serviceConfigWithDisabledTraceService,
            },
          ],
        }),
        HttpClient.forInstance(),
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
              provide: HTTP_SERVICE_CONFIG,
              useValue: serviceConfigWithDisabledTraceService,
            },
          ],
        }),
        HttpClient.forInstance(),
      ],
    }).compile();

    const { serviceConfig } = appModuleRef.get(HttpClientService);
    expect(serviceConfig).toEqual(expectedConfig);
  });

  it('dynamic modules has different scopes', async () => {
    await Test.createTestingModule({
      imports: [
        HttpClient.forRoot({
          providers: [
            {
              provide: GOT_CONFIG,
              useValue: { timeout: 999, retry: 5 },
            },
          ],
        }),
        HttpClient.forInstance(),
      ],
    }).compile();

    const innerModuleRef = await Test.createTestingModule({
      imports: [
        HttpClient.forInstance({
          providers: [
            {
              provide: GOT_CONFIG,
              useValue: { retry: 10 },
            },
          ],
        }),
        HttpClient.forRoot(),
      ],
    }).compile();

    const { clientOpts } = innerModuleRef.get(HttpClientService);
    expect(clientOpts.retry.limit).toEqual(10);
  });

  it('For instance has priority', async () => {
    const module = await Test.createTestingModule({
      imports: [
        HttpClient.forRoot({
          providers: [
            {
              provide: GOT_CONFIG,
              useValue: { timeout: 999, retry: 5 },
            },
          ],
        }),
        HttpClient.forInstance({
          providers: [
            {
              provide: GOT_CONFIG,
              useValue: { timeout: 999, retry: 1 },
            },
          ],
        }),
      ],
    }).compile();

    const { clientOpts } = module.get(HttpClientService);
    expect(clientOpts.retry.limit).toEqual(1);
    expect(clientOpts.timeout.request).toEqual(999);
  });

  it('Should use default values if nothing overridden', async () => {
    const module = await Test.createTestingModule({
      imports: [HttpClient.forRoot(), HttpClient.forInstance()],
    }).compile();

    const service = module.get(HttpClientService);
    expect(service.clientOpts.retry.limit).toEqual(2);
    expect(service.serviceConfig.enableTraceService).toEqual(false);
  });
});
