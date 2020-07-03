import got from 'got';
import { merge } from 'lodash';
import { DynamicModule } from '@nestjs/common';
import { HttpClientService } from './http-client.service';
import { HttpClientForRootType } from './types/config.types';
import { httpServiceConfigDefaults } from './http-client.config.defaults';

import {
  GOT_INSTANCE,
  HTTP_CLIENT_ROOT_GOT_OPTS,
  HTTP_CLIENT_INSTANCE_GOT_OPTS,
  HTTP_CLIENT_SERVICE_CONFIG,
} from './di-token-constants';

const globalState = {
  imports: [],
  providers: [],
};

function addDefaults(providers, defaults) {
  const providersList = [...providers];
  defaults.forEach(providerDefault => {
    const { provide } = providerDefault;
    const passedProvider = providers.find(
      provider => provider.provide === provide,
    );
    if (!passedProvider) {
      providersList.push(providerDefault);
    }
  });
  return providersList;
}

export class HttpClient {
  static forRoot({
    imports = [],
    providers = [],
  }: HttpClientForRootType): DynamicModule {
    const defaults = [
      {
        provide: HTTP_CLIENT_ROOT_GOT_OPTS,
        useValue: {},
      },
      {
        provide: HTTP_CLIENT_SERVICE_CONFIG,
        useValue: httpServiceConfigDefaults,
      },
    ];

    const providersWithDefaults = addDefaults(providers, defaults);

    globalState.imports = imports;
    globalState.providers = providersWithDefaults;

    const gotProviderFactory = {
      provide: GOT_INSTANCE,
      useFactory: (clientRootOpts = {}) => {
        return got.extend(clientRootOpts);
      },
      inject: [HTTP_CLIENT_ROOT_GOT_OPTS],
    };

    return {
      module: HttpClient,
      imports,
      providers: [
        ...globalState.providers,
        HttpClientService,
        gotProviderFactory,
      ],
      exports: [HttpClientService],
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
    ];
    const providersWithDefaults = addDefaults(providers, defaults);
    const providersWithGlobals = [
      ...providersWithDefaults,
      ...globalState.providers,
    ];

    const gotProviderFactory = {
      provide: GOT_INSTANCE,
      useFactory: (globalOpts = {}, clientOpts = {}) => {
        return got.extend(merge(globalOpts, clientOpts));
      },
      inject: [HTTP_CLIENT_ROOT_GOT_OPTS, HTTP_CLIENT_INSTANCE_GOT_OPTS],
    };

    return {
      imports: [...globalState.imports, ...imports],
      module: HttpClient,
      providers: [
        ...providersWithGlobals,
        HttpClientService,
        gotProviderFactory,
      ],
      exports: [HttpClientService],
    };
  }
}
