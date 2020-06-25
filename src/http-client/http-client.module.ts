import got from "got";
import { DynamicModule, Module, Provider } from "@nestjs/common";
import { HttpClientService } from "./http-client.service";
import { httpClientConfig, HttpClientConfigType } from "./http-client.config";

import {
  GOT_INSTANCE,
  HTTP_AGENT_CONFIG,
  TRACE_DATA_SERVICE,
  TRACE_SERVICE_CONFIG
} from "./constants";

@Module({
  providers: [
    HttpClientService,
    {
      provide: GOT_INSTANCE,
      useValue: got
    },
    {
      provide: HTTP_AGENT_CONFIG,
      useValue: httpClientConfig
    }
  ],
  exports: [GOT_INSTANCE]
})
export class HttpClient {
  static register({
    imports,
    clientOpts,
    traceServiceOpts,
    useClass
  }: HttpClientConfigType): DynamicModule {
    const providers: Array<Provider> = [
      {
        provide: GOT_INSTANCE,
        useValue: got.extend(clientOpts)
      },
      {
        provide: HTTP_AGENT_CONFIG,
        useValue: httpClientConfig
      }
    ];

    if (imports && useClass && traceServiceOpts) {
      providers.push({
        provide: TRACE_DATA_SERVICE,
        useClass
      });

      providers.push({
        provide: TRACE_SERVICE_CONFIG,
        useValue: traceServiceOpts
      });

      return {
        imports,
        module: HttpClient,
        providers,
        exports: [HttpClientService]
      };
    }

    return {
      module: HttpClient,
      providers,
      exports: [HttpClientService]
    };
  }
}
