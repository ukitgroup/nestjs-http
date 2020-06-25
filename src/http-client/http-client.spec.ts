import nock from "nock";
import { Got } from "got";
import { Test, TestingModule } from "@nestjs/testing";
import {
  Controller,
  Get,
  HttpCode,
  Inject,
  INestApplication
} from "@nestjs/common";
import supertest from "supertest";
import { HttpClient } from "./http-client.module";
import { HttpClientService } from "./http-client.service";

import { traceServiceOptsMock } from "./mocks/config.mock";
import { HttpClientConfigType } from "./http-client.config";
import { TraceDataServiceMock } from "./mocks/trace-data-service.mock";
import { TraceDataServiceModuleMock } from "./mocks/trace-data-module.mock";

describe("HttpClient", () => {
  const mockUrl = "http://example.domain";
  const traceIdHeader = "x-trace-id";

  const ctx: {
    appModule?: TestingModule;
    app?: INestApplication;
    http?: supertest.SuperTest<supertest.Test>;
  } = {};

  let retryCounter = 0;

  async function instantiateContext({
    clientOpts = {},
    traceServiceOpts = null
  }: HttpClientConfigType) {
    @Controller("/")
    class TestController {
      constructor(
        @Inject(HttpClientService) private readonly httpClient: Got
      ) {}

      @Get("transit")
      @HttpCode(200)
      private async getSuccessHandler() {
        return this.httpClient.get(`${mockUrl}/transitEndpoint`).json();
      }

      @Get("error")
      @HttpCode(500)
      private async getErrorHandler() {
        try {
          return await this.httpClient.get(`${mockUrl}/error`);
        } catch (err) {
          return err;
        }
      }
    }

    ctx.appModule = await Test.createTestingModule({
      imports: [
        HttpClient.register({
          imports: [TraceDataServiceModuleMock],
          clientOpts,
          traceServiceOpts,
          useClass: TraceDataServiceMock
        })
      ],
      controllers: [TestController]
    }).compile();

    ctx.app = ctx.appModule.createNestApplication();
    await ctx.app.init();

    ctx.http = supertest(ctx.app.getHttpServer());
  }

  beforeAll(async () => {
    nock(mockUrl)
      .get("/transitEndpoint")
      .times(10)
      .reply(200, function handler() {
        // Loopback received headers into body
        return { headers: this.req.headers };
      });

    nock(mockUrl)
      .get("/error")
      .times(10)
      .reply(500, () => {
        retryCounter += 1;
        return { error: "error message" };
      });
  });

  beforeEach(() => {
    ctx.appModule = null;
    ctx.app = null;
    ctx.http = null;
    retryCounter = 0;
  });

  it("Test attach headers for transit request", async () => {
    await instantiateContext({
      clientOpts: {},
      traceServiceOpts: traceServiceOptsMock
    });
    const expectedHeaders = {
      [traceIdHeader]: "test-id",
      "x-real-ip": "185.154.75.21",
      referrer: "my-referrer.com/some/page.html"
    };
    const {
      body: { headers }
    } = await ctx.http
      .get("/transit")
      .set(traceIdHeader, "test-id")
      .set("x-real-ip", "185.154.75.21")
      .set("user-agent", "my-awesome-agent")
      .set("referrer", "my-referrer.com/some/page.html");
    Object.entries(expectedHeaders).forEach(([headerName, value]) => {
      expect(headers[headerName]).toEqual(value);
    });
  });

  it("Test applying HttpAgent config, based on retry number", async () => {
    await instantiateContext({
      clientOpts: {
        retry: {
          limit: 3,
          calculateDelay: ({ attemptCount, retryOptions }) =>
            attemptCount > retryOptions.limit ? 0 : 100
        }
      },
      traceServiceOpts: traceServiceOptsMock
    });
    await ctx.http.get("/error");
    expect(retryCounter).toEqual(4);
  });

  it("Test HttpAgent works properly with no trace service provided", async () => {
    await instantiateContext({
      clientOpts: {
        retry: {
          limit: 3,
          calculateDelay: ({ attemptCount, retryOptions }) =>
            attemptCount > retryOptions.limit ? 0 : 100
        }
      }
    });
    await ctx.http.get("/error");
    expect(retryCounter).toEqual(4);
  });

  it("Test excludes headers for certain interaction Api, based on config", async () => {
    await instantiateContext({
      clientOpts: {},
      traceServiceOpts: {
        ...traceServiceOptsMock,
        excludeHeaders: ["referrer"]
      }
    });
    const {
      body: { headers }
    } = await ctx.http
      .get("/transit")
      .set(traceIdHeader, "test-id")
      .set("x-real-ip", "185.154.75.21")
      .set("referrer", "my-referrer.com/some/page.html");
    expect(headers.referrer).toEqual(undefined);
  });

  it("Test all HTTP methods are available", async () => {
    const methods = ["get", "post", "delete", "head", "put", "patch"];
    await instantiateContext({ clientOpts: {} });
    const clientService = ctx.app.get(HttpClientService);
    methods.forEach(method => {
      expect(clientService[method]).toBeInstanceOf(Function);
    });
  });

  it("Test multiple HttpAgent instantiation", async () => {
    const firstModuleRef = await Test.createTestingModule({
      imports: [
        HttpClient.register({
          imports: [TraceDataServiceModuleMock],
          clientOpts: {}
        })
      ]
    }).compile();

    const secondModuleRef = await Test.createTestingModule({
      imports: [
        HttpClient.register({
          imports: [TraceDataServiceModuleMock],
          clientOpts: {}
        })
      ]
    }).compile();

    const firstHttpAgentInstance = firstModuleRef.get(HttpClientService);
    const secondHttpAgentInstance = secondModuleRef.get(HttpClientService);

    expect(firstHttpAgentInstance).toBeInstanceOf(HttpClientService);
    expect(secondHttpAgentInstance).toBeInstanceOf(HttpClientService);
    expect(firstHttpAgentInstance).not.toEqual(secondHttpAgentInstance);
  });
});
