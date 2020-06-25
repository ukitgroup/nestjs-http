import { Options } from "got";
import { Type, DynamicModule, ForwardReference } from "@nestjs/common";

export const httpClientConfig: Omit<
  HttpClientConfigType,
  "useClass" | "imports"
> = {
  clientOpts: {},
  traceServiceOpts: {
    headersMap: {
      traceId: "x-trace-id",
      ip: "x-real-ip",
      userAgent: "user-agent",
      referrer: "referrer"
    },
    excludeHeaders: []
  }
};

export type clientOptsType = Options;
export type traceServiceOptsType = {
  headersMap: {
    [key: string]: string;
  };
  excludeHeaders: Array<string>;
};

export type HttpClientConfigType = {
  imports?: Array<
    Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
  >;
  useClass?: Type<any>;
  clientOpts: clientOptsType;
  traceServiceOpts?: traceServiceOptsType;
};
