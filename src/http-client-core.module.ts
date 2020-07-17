import { DynamicModule, Global, Module } from '@nestjs/common';
import http from 'http';
import https from 'https';
import { HttpClientForRootType } from './types/config.types';
import { HTTP_CLIENT_ROOT_GOT_OPTS } from './di-token-constants';
import { addDefaults } from './utils';

@Global()
@Module({})
export class HttpClientCoreModule {
  static forRoot({
    imports = [],
    providers = [],
  }: HttpClientForRootType): DynamicModule {
    const defaults = [
      {
        provide: HTTP_CLIENT_ROOT_GOT_OPTS,
        useValue: {
          agent: {
            http: new http.Agent({ keepAlive: true }),
            https: new https.Agent({ keepAlive: true }),
          },
        },
      },
    ];

    const providersWithDefaults = addDefaults(providers, defaults);

    return {
      module: HttpClientCoreModule,
      imports,
      providers: providersWithDefaults,
      exports: providersWithDefaults,
    };
  }
}
