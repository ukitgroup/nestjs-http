import { DynamicModule, Global, Module } from '@nestjs/common';
import http from 'http';
import https from 'https';
import { HttpClientForRootType } from './types/config.types';
import { DEFAULT__GOT_OPTS } from './di-token-constants';

@Global()
@Module({})
export class HttpClientCoreModule {
  static forRoot({
    imports = [],
    providers = [],
  }: HttpClientForRootType): DynamicModule {
    const defaultProviders = [
      {
        provide: DEFAULT__GOT_OPTS,
        useValue: {
          agent: {
            http: new http.Agent({ keepAlive: true }),
            https: new https.Agent({ keepAlive: true }),
          },
        },
      },
    ];

    return {
      module: HttpClientCoreModule,
      imports,
      providers: [...defaultProviders, ...providers],
      exports: [...defaultProviders, ...providers],
    };
  }
}
