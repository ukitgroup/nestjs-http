import {
  DynamicModule,
  ForwardReference,
  Provider,
  Type,
} from '@nestjs/common';

export type HttpClientForRootType = {
  imports?: Array<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
  >;
  providers?: Array<Provider>;
};

export type ServiceConfigType = {
  enableTraceService?: boolean;
  headersMap?: {
    [key: string]: string;
  };
  excludeHeaders?: Array<string>;
};
