import nock from 'nock';
import { Got } from 'got';
import { Test, TestingModule } from '@nestjs/testing';
import {
  Controller,
  Get,
  HttpCode,
  Inject,
  INestApplication,
} from '@nestjs/common';
import supertest from 'supertest';
import { HttpClient } from '../http-client.module';
import { HttpClientService } from '../http-client.service';
import { httpServiceConfigMock } from '../mocks/config-module/config-module.config.mock';

import { ConfigModuleMock } from '../mocks/config-module/config-module.mock';
import { TraceDataServiceMock } from '../mocks/trace-data-module/trace-data-service.mock';
import { TraceDataServiceModuleMock } from '../mocks/trace-data-module/trace-data-module.mock';
import {
  HTTP_CLIENT_ROOT_GOT_OPTS,
  TRACE_DATA_SERVICE,
  HTTP_CLIENT_SERVICE_CONFIG,
  HTTP_CLIENT_INSTANCE_GOT_OPTS,
} from '../di-token-constants';

import {
  HttpClientForRootType,
  ServiceConfigType,
  HttpClientOptionsType,
} from '../types/config.types';

describe('HttpClient.forRoot integration tests', () => {
  const mockUrl = 'http://example.domain';
  const traceIdHeader = 'x-trace-id';

  const ctx: {
    appModule?: TestingModule;
    app?: INestApplication;
    http?: supertest.SuperTest<supertest.Test>;
  } = {};

  let retryCounter = 0;

  beforeAll(async () => {
    nock(mockUrl)
      .get('/transitEndpoint')
      .times(10)
      .reply(200, function handler() {
        /* Loopback received headers into body */
        return { headers: this.req.headers };
      });

    nock(mockUrl)
      .get('/error')
      .times(10)
      .reply(500, () => {
        retryCounter += 1;
        return { error: 'error message' };
      });
  });

  beforeEach(() => {
    ctx.appModule = null;
    ctx.app = null;
    ctx.http = null;
    retryCounter = 0;
  });

  describe('HttpClient.forInstance integration tests', () => {
    async function instantiateContextForInstance({
      clientOpts,
    }: {
      clientOpts?: HttpClientOptionsType;
    }) {
      @Controller('/')
      class TestController {
        constructor(
          @Inject(HttpClientService) private readonly httpClient: Got,
        ) {}

        @Get('error')
        @HttpCode(500)
        private async getErrorHandler() {
          try {
            return await this.httpClient.get(`${mockUrl}/error`);
          } catch (err) {
            return err;
          }
        }
      }

      const providers = [];

      if (clientOpts) {
        providers.push({
          provide: HTTP_CLIENT_INSTANCE_GOT_OPTS,
          useValue: clientOpts,
        });
      }

      const forRootProps: HttpClientForRootType = {
        imports: [ConfigModuleMock],
        providers,
      };

      ctx.appModule = await Test.createTestingModule({
        imports: [HttpClient.forInstance(forRootProps)],
        controllers: [TestController],
      }).compile();

      ctx.app = ctx.appModule.createNestApplication();
      await ctx.app.init();

      ctx.http = supertest(ctx.app.getHttpServer());
    }

    it('Test clientOpts applying to HttpClient', async () => {
      await instantiateContextForInstance({
        clientOpts: {
          retry: 1,
        },
      });

      await ctx.http.get('/error');
      expect(retryCounter).toEqual(2);
    });
  });

  describe('HttpService.forRoot method', () => {
    async function instantiateContextForRoot({
      clientOpts,
      moduleOpts,
      injectTraceService = false,
    }: {
      clientOpts?: HttpClientOptionsType;
      moduleOpts?: ServiceConfigType;
      injectTraceService: boolean;
    }) {
      @Controller('/')
      class TestController {
        constructor(
          @Inject(HttpClientService) private readonly httpClient: Got,
        ) {}

        @Get('transit')
        @HttpCode(200)
        private async getSuccessHandler() {
          return this.httpClient.get(`${mockUrl}/transitEndpoint`).json();
        }

        @Get('error')
        @HttpCode(500)
        private async getErrorHandler() {
          try {
            return await this.httpClient.get(`${mockUrl}/error`);
          } catch (err) {
            return err;
          }
        }
      }

      const providers = [];

      if (moduleOpts) {
        providers.push({
          provide: HTTP_CLIENT_SERVICE_CONFIG,
          useValue: moduleOpts,
        });
      }

      if (clientOpts) {
        providers.push({
          provide: HTTP_CLIENT_ROOT_GOT_OPTS,
          useValue: clientOpts,
        });
      }

      if (injectTraceService) {
        providers.push({
          provide: TRACE_DATA_SERVICE,
          useClass: TraceDataServiceMock,
        });
      }

      const forRootProps: HttpClientForRootType = {
        imports: [ConfigModuleMock, TraceDataServiceModuleMock],
        providers,
      };

      ctx.appModule = await Test.createTestingModule({
        imports: [HttpClient.forRoot(forRootProps)],
        controllers: [TestController],
      }).compile();

      ctx.app = ctx.appModule.createNestApplication();
      await ctx.app.init();

      ctx.http = supertest(ctx.app.getHttpServer());
    }

    it('Test attach headers for transit request', async () => {
      await instantiateContextForRoot({
        clientOpts: {},
        moduleOpts: httpServiceConfigMock,
        injectTraceService: true,
      });
      const expectedHeaders = {
        [traceIdHeader]: 'test-id',
        'x-real-ip': '185.154.75.21',
        referrer: 'my-referrer.com/some/page.html',
      };
      const {
        body: { headers },
      } = await ctx.http
        .get('/transit')
        .set(traceIdHeader, 'test-id')
        .set('x-real-ip', '185.154.75.21')
        .set('user-agent', 'my-awesome-agent')
        .set('referrer', 'my-referrer.com/some/page.html');
      Object.entries(expectedHeaders).forEach(([headerName, value]) => {
        expect(headers[headerName]).toEqual(value);
      });
    });

    it("Test attach headers for transit request with service default config, if custom wasn't pass", async () => {
      await instantiateContextForRoot({
        clientOpts: {},
        injectTraceService: true,
      });
      const expectedHeaders = {
        [traceIdHeader]: 'test-id',
        'x-real-ip': '185.154.75.21',
        referrer: 'my-referrer.com/some/page.html',
      };
      const {
        body: { headers },
      } = await ctx.http
        .get('/transit')
        .set(traceIdHeader, 'test-id')
        .set('x-real-ip', '185.154.75.21')
        .set('user-agent', 'my-awesome-agent')
        .set('referrer', 'my-referrer.com/some/page.html');
      Object.entries(expectedHeaders).forEach(([headerName, value]) => {
        expect(headers[headerName]).toEqual(value);
      });
    });

    it('Test applying excludes module config', async () => {
      const expectedHeaders = {
        [traceIdHeader]: 'test-id',
        'x-real-ip': '185.154.75.21',
      };

      await instantiateContextForRoot({
        moduleOpts: {
          ...httpServiceConfigMock,
          excludeHeaders: ['referrer'],
        },
        injectTraceService: true,
      });
      const {
        body: { headers },
      } = await ctx.http
        .get('/transit')
        .set(traceIdHeader, 'test-id')
        .set('x-real-ip', '185.154.75.21')
        .set('user-agent', 'my-awesome-agent')
        .set('referrer', 'my-referrer.com/some/page.html');

      Object.entries(expectedHeaders).forEach(([headerName, value]) => {
        expect(headers[headerName]).toEqual(value);
      });
      expect(headers.referrer).toEqual(undefined);
    });
  });
});
