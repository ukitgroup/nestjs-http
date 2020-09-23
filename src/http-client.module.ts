import got from 'got';
import { DynamicModule, Module } from '@nestjs/common';
import { HttpClientForRootType } from './types/config.types';
import { HttpClientCoreModule } from './http-client-core.module';
import { GOT_INSTANCE, HTTP_CLIENT_SERVICE_CONFIG } from './di-token-constants';
import { HttpClientService } from './http-client.service';
import { httpServiceConfigDefaults } from './http-client.config.defaults';
import { GotConfigProvider } from './got-config.provider';

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
  }: HttpClientForRootType = {}): DynamicModule {
    const defaultProviders = [
      {
        provide: HTTP_CLIENT_SERVICE_CONFIG,
        useValue: httpServiceConfigDefaults,
      },
    ];

    const gotProviderFactory = {
      provide: GOT_INSTANCE,
      useFactory: (gotConfigProvider: GotConfigProvider) => {
        const config = gotConfigProvider.getConfig();
        return got.extend(config);
      },
      inject: [GotConfigProvider],
    };
    return {
      module: HttpClient,
      imports,
      providers: [
        ...defaultProviders,
        ...providers,
        gotProviderFactory,
        GotConfigProvider,
        HttpClientService,
      ],
      exports: [HttpClientService],
    };
  }
}
