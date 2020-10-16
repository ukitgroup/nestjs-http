import { Inject, Injectable, Optional } from '@nestjs/common';
import { merge } from 'lodash';

import {
  DEFAULT__SERVICE_CONFIG,
  FOR_INSTANCE__SERVICE_CONFIG,
  FOR_ROOT__SERVICE_CONFIG,
} from './di-token-constants';
import { ServiceConfigType } from './types/config.types';

@Injectable()
export class HttpServiceConfigProvider {
  constructor(
    @Inject(DEFAULT__SERVICE_CONFIG)
    private readonly defaultServiceConfig: ServiceConfigType,
    @Optional()
    @Inject(FOR_ROOT__SERVICE_CONFIG)
    private readonly forRootServiceConfig: ServiceConfigType = {},
    @Optional()
    @Inject(FOR_INSTANCE__SERVICE_CONFIG)
    private readonly forInstanceServiceConfig: ServiceConfigType = {},
  ) {}

  getConfig(): ServiceConfigType {
    return merge(
      {},
      this.defaultServiceConfig,
      this.forRootServiceConfig,
      this.forInstanceServiceConfig,
    );
  }
}
