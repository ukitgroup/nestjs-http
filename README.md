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
- Accept external `Tracing Service` for attaching specific http-headers across your microservice architecture;
- Modularity - create instances for your modules with different configurations;
- Default keep-alive http/https agent.

## Instalation

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
        { // override got configuration
          provide: HTTP_CLIENT_INSTANCE_GOT_OPTS,
          inject: [YourConfig],
          useFactory: (config) => {
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
  imports: [
    HttpClient.forRoot({}),
    CatModule,
  ],
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
- `HTTP_CLIENT_SERVICE_CONFIG` - ServiceConfigType for HttpClientService
- `TRACE_DATA_SERVICE` - should implements TraceDataServiceInterface
- `HTTP_CLIENT_ROOT_GOT_OPTS` - got root configuration
- `HTTP_CLIENT_INSTANCE_GOT_OPTS` - got instance configuration

Define instance configuration, trace service and http client service config in your module with:

```
HttpClient.forInstance(options: HttpClientForRootType)
```

## Requirements
1. @nestjs/common ^7.2.0
2. @nestjs/core ^7.2.0

## License
@ukitgroup/nestjs-http is [MIT licensed](LICENSE).
