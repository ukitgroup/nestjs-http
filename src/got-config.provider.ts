import { Inject, Optional } from '@nestjs/common';
import { merge } from 'lodash';

import { Options } from 'got';
import {
  DEFAULT__GOT_OPTS,
  FOR_INSTANCE__GOT_OPTS,
  FOR_ROOT__GOT_OPTS,
} from './di-token-constants';

export class GotConfigProvider {
  constructor(
    @Inject(DEFAULT__GOT_OPTS)
    private readonly defaultGotConfig: Options,
    @Optional()
    @Inject(FOR_ROOT__GOT_OPTS)
    private readonly forRootGotConfig: Options = {},
    @Optional()
    @Inject(FOR_INSTANCE__GOT_OPTS)
    private readonly forInstanceGotConfig: Options = {},
  ) {}

  getConfig(): Options {
    return merge(
      this.defaultGotConfig,
      this.forRootGotConfig,
      this.forInstanceGotConfig,
    );
  }
}
