import { DynamicModule, Global, Module } from '@nestjs/common';
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
        useValue: {},
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
