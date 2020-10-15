import {
  Controller,
  Get,
  HttpCode,
  INestApplication,
  Inject,
  Module,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Got } from 'got';
import supertest from 'supertest';
import nock from 'nock';
import { HttpClient, HttpClientService } from '../src';
import {
  GOT_CONFIG,
  HTTP_SERVICE_CONFIG,
  TRACE_DATA_SERVICE,
} from '../src/public-di-token.constants';
import { TraceDataServiceModuleMock } from './fixtures/trace-data-module/trace-data-module.mock';
import { TraceDataServiceMock } from './fixtures/trace-data-module/trace-data-service.mock';
import { ConfigModuleMock } from './fixtures/config-module/config-module.mock';
import { httpServiceConfigMock } from './fixtures/config-module/config-module.config.mock';

describe('Trace data service', () => {
  const mockUrl = 'http://example.domain';

  const ctx: {
    appModule?: TestingModule;
    app?: INestApplication;
    http?: supertest.SuperTest<supertest.Test>;
  } = {};

  @Controller('cat')
  class CatController {
    constructor(@Inject(HttpClientService) private readonly httpClient: Got) {}

    @Get('transit')
    @HttpCode(200)
    private async getSuccessHandler() {
      return this.httpClient.get(`${mockUrl}/transit`).json();
    }
  }

  @Module({
    imports: [
      HttpClient.forInstance({
        imports: [ConfigModuleMock, TraceDataServiceModuleMock],
        providers: [
          {
            provide: GOT_CONFIG,
            useValue: { retry: { limit: 1 } },
          },
          {
            provide: HTTP_SERVICE_CONFIG,
            useValue: {
              ...httpServiceConfigMock,
              excludeHeaders: ['referrer'],
            },
          },
          { provide: TRACE_DATA_SERVICE, useClass: TraceDataServiceMock },
        ],
      }),
    ],
    controllers: [CatController],
  })
  class CatModule {}

  beforeEach(async () => {
    nock(mockUrl)
      .get('/transit')
      .times(10)
      .reply(200, function handler() {
        return { headers: this.req.headers };
      });

    ctx.appModule = await Test.createTestingModule({
      imports: [HttpClient.forRoot({}), CatModule],
    }).compile();

    ctx.app = ctx.appModule.createNestApplication();
    await ctx.app.init();

    ctx.http = supertest(ctx.app.getHttpServer());
  });

  afterEach(async () => {
    await ctx.app.close();
    nock.cleanAll();
  });

  it('should retry once', async () => {
    const expectedHeaders = {
      'x-trace-id': 'test-id',
      'x-real-ip': '185.154.75.21',
      // referrer: 'my-referrer.com/some/page.html',
    };
    const {
      body: { headers },
    } = await ctx.http
      .get('/cat/transit')
      .set('x-trace-id', expectedHeaders['x-trace-id'])
      .set('x-real-ip', expectedHeaders['x-real-ip'])
      .set('referrer', 'my-referrer.com/some/page.html');

    Object.entries(expectedHeaders).forEach(([headerName, value]) => {
      expect(headers[headerName]).toEqual(value);
    });
  });
});
