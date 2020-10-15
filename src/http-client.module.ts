import got from 'got';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { HttpClientForRootType } from './types/config.types';
import { HttpClientCoreModule } from './http-client-core.module';
import {
  FOR_INSTANCE__GOT_OPTS,
  FOR_INSTANCE__SERVICE_CONFIG,
  GOT_INSTANCE,
} from './di-token-constants';
import { HttpClientService } from './http-client.service';
import { GotConfigProvider } from './got-config.provider';
import { HttpServiceConfigProvider } from './http-service-config.provider';
import { GOT_CONFIG, HTTP_SERVICE_CONFIG } from './public-di-token.constants';
import { uniqueProvidersByToken } from './utils';

@Module({})
export class HttpClient {
  static forRoot({
    imports = [],
    providers = [],
  }: HttpClientForRootType = {}): DynamicModule {
    return {
      module: HttpClient,
      imports: [HttpClientCoreModule.forRoot({ imports, providers })],
    };
  }

  static forInstance({
    imports = [],
    providers = [],
  }: HttpClientForRootType = {}): DynamicModule {
    const gotProviderFactory = {
      provide: GOT_INSTANCE,
      useFactory: (gotConfigProvider: GotConfigProvider) => {
        const config = gotConfigProvider.getConfig();
        return got.extend(config);
      },
      inject: [GotConfigProvider],
    };

    const allProviders: Provider[] = [];

    const forInstanceGotConfigProvider = providers.find(
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      p => p.provide && p.provide === GOT_CONFIG,
    );

    const forInstanceHTTPServiceProvider = providers.find(
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      p => p.provide && p.provide === HTTP_SERVICE_CONFIG,
    );

    if (forInstanceGotConfigProvider) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      allProviders.push({
        ...forInstanceGotConfigProvider,
        provide: FOR_INSTANCE__GOT_OPTS,
      });
    }

    if (forInstanceHTTPServiceProvider) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      allProviders.push({
        ...forInstanceHTTPServiceProvider,
        provide: FOR_INSTANCE__SERVICE_CONFIG,
      });
    }

    const uniqueProviders = uniqueProvidersByToken([
      ...allProviders,
      ...providers,
      gotProviderFactory,
      HttpServiceConfigProvider,
      GotConfigProvider,
      HttpClientService,
    ]);

    return {
      module: HttpClient,
      imports,
      providers: uniqueProviders,
      exports: [HttpClientService],
    };
  }
}
