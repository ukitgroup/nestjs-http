import got from 'got';
import { merge } from 'lodash';
import { DynamicModule, Module } from '@nestjs/common';
import { HttpClientForRootType } from './types/config.types';
import { HttpClientCoreModule } from './http-client-core.module';
import {
  GOT_INSTANCE,
  HTTP_CLIENT_INSTANCE_GOT_OPTS,
  HTTP_CLIENT_ROOT_GOT_OPTS,
  HTTP_CLIENT_SERVICE_CONFIG,
} from './di-token-constants';
import { HttpClientService } from './http-client.service';
import { httpServiceConfigDefaults } from './http-client.config.defaults';
import { addDefaults } from './utils';

@Module({})
export class HttpClient {
  static forRoot({
    imports = [],
    providers = [],
  }: HttpClientForRootType): DynamicModule {
    return {
      module: HttpClient,
      imports: [HttpClientCoreModule.forRoot({ imports, providers })],
    };
  }

  static forInstance({
    imports = [],
    providers = [],
  }: HttpClientForRootType): DynamicModule {
    const defaults = [
      {
        provide: HTTP_CLIENT_INSTANCE_GOT_OPTS,
        useValue: {},
      },
      {
        provide: HTTP_CLIENT_SERVICE_CONFIG,
        useValue: httpServiceConfigDefaults,
      },
    ];
    const providersWithDefaults = addDefaults(providers, defaults);

    const gotProviderFactory = {
      provide: GOT_INSTANCE,
      useFactory: (globalOpts = {}, clientOpts = {}) => {
        return got.extend(merge(globalOpts, clientOpts));
      },
      inject: [HTTP_CLIENT_ROOT_GOT_OPTS, HTTP_CLIENT_INSTANCE_GOT_OPTS],
    };
    return {
      module: HttpClient,
      imports,
      providers: [
        ...providersWithDefaults,
        gotProviderFactory,
        HttpClientService,
      ],
      exports: [HttpClientService],
    };
  }
}
