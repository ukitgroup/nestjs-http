import { DynamicModule, Global, Module } from '@nestjs/common';
import { HttpClientForRootType } from './types/config.types';
import {
  DEFAULT__GOT_OPTS,
  DEFAULT__SERVICE_CONFIG,
} from './di-token-constants';
import { gotConfigDefaults } from './got.config.defaults';
import { httpServiceConfigDefaults } from './http-client.config.defaults';

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
        useValue: gotConfigDefaults,
      },
      {
        provide: DEFAULT__SERVICE_CONFIG,
        useValue: httpServiceConfigDefaults,
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
