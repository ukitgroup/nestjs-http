import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { HttpClientForRootType } from './types/config.types';
import {
  DEFAULT__GOT_OPTS,
  DEFAULT__SERVICE_CONFIG,
  FOR_ROOT__GOT_OPTS,
  FOR_ROOT__SERVICE_CONFIG,
} from './di-token-constants';
import { gotConfigDefaults } from './got.config.defaults';
import { httpServiceConfigDefaults } from './http-client.config.defaults';
import { GOT_CONFIG, HTTP_SERVICE_CONFIG } from './public-di-token.constants';
import { uniqueProvidersByToken } from './utils';

@Global()
@Module({})
export class HttpClientCoreModule {
  static forRoot({
    imports = [],
    providers = [],
  }: HttpClientForRootType): DynamicModule {
    const defaultProviders: Provider[] = [
      {
        provide: DEFAULT__GOT_OPTS,
        useValue: gotConfigDefaults,
      },
      {
        provide: DEFAULT__SERVICE_CONFIG,
        useValue: httpServiceConfigDefaults,
      },
    ];
    const forRootGotConfigProvider = providers.find(
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      p => p.provide && p.provide === GOT_CONFIG,
    );

    const forRootHTTPServiceProvider = providers.find(
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      p => p.provide && p.provide === HTTP_SERVICE_CONFIG,
    );

    if (forRootGotConfigProvider) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      defaultProviders.push({
        ...forRootGotConfigProvider,
        provide: FOR_ROOT__GOT_OPTS,
      });
    }

    if (forRootHTTPServiceProvider) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      defaultProviders.push({
        ...forRootHTTPServiceProvider,
        provide: FOR_ROOT__SERVICE_CONFIG,
      });
    }

    const uniqueProviders = uniqueProvidersByToken([
      ...defaultProviders,
      ...providers,
    ]);

    return {
      module: HttpClientCoreModule,
      imports,
      providers: uniqueProviders,
      exports: uniqueProviders,
    };
  }
}
