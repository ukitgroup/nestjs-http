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
import { calculateDelayMock } from './fixtures/got-mock';
import { GOT_CONFIG } from '../src/public-di-token.constants';

describe('Use different options for GOT in different modules', () => {
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

  @Controller('root')
  class RootController {
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
          {
            provide: GOT_CONFIG,
            useValue: { retry: { limit: 4 } },
          },
        ],
      }),
    ],
    controllers: [CatController],
  })
  class CatModule {}

  @Module({
    imports: [HttpClient.forInstance()],
    controllers: [RootController],
  })
  class RootModule {}

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
          {
            provide: GOT_CONFIG,
            useValue: { retry: { limit: 3 } },
          },
        ],
      }),
    ],
    controllers: [DogController],
  })
  class DogModule {}

  beforeEach(async () => {
    nock(mockUrl)
      .get('/error')
      .times(20)
      .reply(500, () => {
        tryCounter += 1;
        return { error: 'error message' };
      });

    ctx.appModule = await Test.createTestingModule({
      imports: [
        HttpClient.forRoot({
          providers: [
            {
              provide: GOT_CONFIG,
              useValue: {
                retry: {
                  limit: 1,
                  calculateDelay: calculateDelayMock,
                },
              },
            },
          ],
        }),
        CatModule,
        DogModule,
        RootModule,
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

  it('should get correct retry option from instance', async () => {
    await ctx.http.get('/cat/error');
    expect(tryCounter).toBe(4);
  });

  it('should retry twice', async () => {
    await ctx.http.get('/dog/error');
    expect(tryCounter).toBe(3);
  });

  it('should get correct retry option from root', async () => {
    await ctx.http.get('/root/error');
    expect(tryCounter).toBe(1);
  });
});
