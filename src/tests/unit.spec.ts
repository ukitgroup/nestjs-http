import { Test } from '@nestjs/testing';
import { httpServiceConfigMock } from '../mocks/config-module/config-module.config.mock';
import { HttpClient } from '../http-client.module';
import { HttpClientService } from '../http-client.service';

import { TraceDataServiceMock } from '../mocks/trace-data-module/trace-data-service.mock';
import { TraceDataServiceModuleMock } from '../mocks/trace-data-module/trace-data-module.mock';

import {
  HTTP_CLIENT_INSTANCE_GOT_OPTS,
  HTTP_CLIENT_ROOT_GOT_OPTS,
  TRACE_DATA_SERVICE,
  HTTP_CLIENT_SERVICE_CONFIG,
} from '../constants';

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
