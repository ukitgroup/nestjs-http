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
  HTTP_CLIENT_INSTANCE_GOT_OPTS,
  HTTP_CLIENT_ROOT_GOT_OPTS,
} from '../src/di-token-constants';

describe('Merge options', () => {
  const mockUrl = 'http://example.domain';
  let tryCounter = 0;
  const ctx: {
    appModule?: TestingModule;
    app?: INestApplication;
    http?: supertest.SuperTest<supertest.Test>;
  } = {};

  @Controller('cat')
  class CatController {
    constructor(@Inject(HttpClientService) private readonly httpClient: Got) {}

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

  @Module({
    imports: [
      HttpClient.forInstance({
        providers: [
          { provide: HTTP_CLIENT_INSTANCE_GOT_OPTS, useValue: { retry: 1 } },
        ],
      }),
    ],
    controllers: [CatController],
  })
  class CatModule {}

  @Controller('dog')
  class DogController {
    constructor(@Inject(HttpClientService) private readonly httpClient: Got) {}

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

  @Module({
    imports: [
      HttpClient.forInstance({
        providers: [
          { provide: HTTP_CLIENT_INSTANCE_GOT_OPTS, useValue: { retry: 2 } },
        ],
      }),
    ],
    controllers: [DogController],
  })
  class DogModule {}

  beforeEach(async () => {
    nock(mockUrl)
      .get('/error')
      .times(10)
      .reply(500, () => {
        tryCounter += 1;
        return { error: 'error message' };
      });

    ctx.appModule = await Test.createTestingModule({
      imports: [
        HttpClient.forRoot({
          providers: [
            { provide: HTTP_CLIENT_ROOT_GOT_OPTS, useValue: { retry: 3 } },
          ],
        }),
        CatModule,
        DogModule,
      ],
    }).compile();

    ctx.app = ctx.appModule.createNestApplication();
    await ctx.app.init();

    ctx.http = supertest(ctx.app.getHttpServer());

    tryCounter = 0;
  });

  afterEach(async () => {
    await ctx.app.close();
    nock.cleanAll();
  });

  it('should retry once', async () => {
    await ctx.http.get('/cat/error');
    expect(tryCounter).toBe(2);
  });

  it('should retry twice', async () => {
    await ctx.http.get('/dog/error');
    expect(tryCounter).toBe(3);
  });
});
