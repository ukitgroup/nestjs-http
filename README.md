# nestjs-http

![Travis](https://img.shields.io/travis/ukitgroup/nestjs-http/master.svg?style=flat-square)
![Coverage Status](https://coveralls.io/repos/github/ukitgroup/nestjs-http/badge.svg?branch=master)
![node](https://img.shields.io/node/v/@ukitgroup/nestjs-http.svg?style=flat-square)
![npm](https://img.shields.io/npm/v/@ukitgroup/nestjs-http.svg?style=flat-square)

![GitHub top language](https://img.shields.io/github/languages/top/ukitgroup/nestjs-http.svg?style=flat-square)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/ukitgroup/nestjs-http.svg?style=flat-square)
![David](https://img.shields.io/david/ukitgroup/nestjs-http.svg?style=flat-square)
![David](https://img.shields.io/david/dev/ukitgroup/nestjs-http.svg?style=flat-square)

![license](https://img.shields.io/github/license/ukitgroup/nestjs-http.svg?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/ukitgroup/nestjs-http.svg?style=flat-square)
![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)

## Description

### Rich featured HttpClient for [nestjs](https://nestjs.com/) applications

- [Got](https://www.npmjs.com/package/got) integration for `nestjs`;
- Retries and all `Got` functions out of the box
- Transparent `Got` usage (you will work with Got interface)
- Accept external `Tracing Service` via DI for attaching specific http-headers across your microservice architecture;
- Modularity - create instances for your modules with different configurations;
- Default keep-alive http/https agent.

## Requirements

1. @nestjs/common ^9.1.4
2. @nestjs/core ^9.1.4

## Installation

```bash
npm install --save @ukitgroup/nestjs-http
```

or

```bash
yarn add @ukitgroup/nestjs-http
```

## Short example

**cat.service.ts**

```typescript
@Injectable()
export class CatService {
  constructor(@Inject(HttpClientService) private readonly httpClient: Got) {}

  meow(): string {
    // httpClient is an instance of Got
    // configuration from AppModule and CatModule
    // set built-in headers
    this.httpClient.post('/meow');
    return `meows..`;
  }
}
```

**cat.module.ts**

```typescript
@Module({
  imports: [
    HttpClient.forInstance({
      imports: [YourConfigModule],
      providers: [
        {
          // override got configuration
          provide: HTTP_CLIENT_INSTANCE_GOT_OPTS,
          inject: [YourConfig],
          useFactory: config => {
            return {
              retry: config.retry,
            };
          },
        },
      ],
    }),
  ],
  providers: [CatService],
})
export class CatModule {}
```

**app.module.ts**

```typescript
@Module({
  imports: [HttpClient.forRoot({}), CatModule],
})
export class AppModule {}
```

## API

Define root configuration for Got in AppModule with:

```
HttpClient.forRoot(options: HttpClientForRootType)
```

```
HttpClientForRootType: {
  imports?: [],
  providers?: [],
}
```

Provide configuration with tokens:

- `HTTP_SERVICE_CONFIG` - ServiceConfigType for HttpClientService
- `TRACE_DATA_SERVICE` - should implements TraceDataServiceInterface
- `GOT_CONFIG` - got configuration

Provided configuration will be merged:
defaultConfig -> forRoot() -> forInstance() -> execution

default config for httpService:

```typescript
const defaultConfig = {
  enableTraceService: false,
  headersMap: {
    traceId: 'x-trace-id',
    ip: 'x-real-ip',
    userAgent: 'user-agent',
    referrer: 'referrer',
  },
  excludeHeaders: [],
};
```

default config for got extends default config from [got documentation](https://github.com/sindresorhus/got)

```typescript
const defaultConfig = {
  agent: {
    http: new http.Agent({ keepAlive: true }),
    https: new https.Agent({ keepAlive: true }),
  },
};
```

Define instance configuration, trace service and http client service config in your module with:

```
HttpClient.forInstance(options: HttpClientForRootType)
```

# Trace service injection

Usually you pass some headers across your microservices such as: `trace-id`, `ip`, `user-agent` etc.
To make it convenient you can inject traceService via `dependency injection` and `HTTPClient` will pass this data with headers

You just have to implement TraceServiceInterface:

```typescript
export interface TraceDataServiceInterface {
  getRequestData(): TraceDataType;
}

// and TraceDataType
export type TraceDataType = {
  [key: string]: string;
};
```

Headers mapping to values:

```typescript
const headersMap = {
  traceId: 'x-trace-id',
  ip: 'x-real-ip',
  userAgent: 'user-agent',
  referrer: 'referrer',
};
```

Sou you can just define your service which should return these fields. For example, you can use `cls-hooked` for retrieving request data

```typescript
export class TraceService implements TraceDataServiceInterface {
  getRequestData() {
    return {
      traceId: 'unique-id',
      ip: '127.0.0.1',
    };
  }
}
```

And then just define configuration:

```typescript
@Module({
  imports: [
    HttpClient.forInstance({
      providers: [
        {
          provide: HTTP_SERVICE_CONFIG,
          useValue: {
            enableTraceService: true,
          },
        },
        { provide: TRACE_DATA_SERVICE, useClass: TraceService },
      ],
    }),
  ],
})
class AwesomeModule {}
```

### TODO

- Injection of `MetricService` for exports requests metrics such as: statuses, errors, retries, timing
- Client balancing for servers with several `ip`s or endpoints in different AZ which don't support server's LB.
- ... Feature/Pull requests are welcome!😅

## License

@ukitgroup/nestjs-http is [MIT licensed](LICENSE).
