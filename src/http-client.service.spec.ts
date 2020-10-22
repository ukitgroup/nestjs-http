import { Got } from 'got';
import { HttpClientService } from './http-client.service';
import { TraceDataServiceInterface } from './types/trace-data-service.interface';
import { ServiceConfigType } from './types/config.types';
import { HttpServiceConfigProviderInterface } from './http-service-config-provider.interface';

describe('HTTP client service', () => {
  let ctx: {
    gotInstance: Got;
    traceDataService: TraceDataServiceInterface;
    httpServiceConfigProvider: HttpServiceConfigProviderInterface;
  };

  beforeEach(() => {
    ctx = {
      gotInstance: {} as Got,
      traceDataService: {
        getRequestData() {
          return {};
        },
      },
      httpServiceConfigProvider: {
        getConfig(): ServiceConfigType {
          return {};
        },
      },
    };
  });

  describe('feature-flag: shouldTraceServiceInvoke', () => {
    it('should throw error if option is provided but service is not', () => {
      ctx.httpServiceConfigProvider = {
        getConfig(): ServiceConfigType {
          return {
            enableTraceService: true,
          };
        },
      };

      ctx.traceDataService = undefined;

      const service = new HttpClientService(
        ctx.gotInstance,
        ctx.traceDataService,
        ctx.httpServiceConfigProvider,
      );

      expect(() => service.shouldTraceServiceInvoke).toThrow(
        /had enabled usage of TraceDataService/,
      );
    });

    it('should return false if option is disabled', () => {
      ctx.httpServiceConfigProvider = {
        getConfig(): ServiceConfigType {
          return {
            enableTraceService: false,
          };
        },
      };

      const service = new HttpClientService(
        ctx.gotInstance,
        ctx.traceDataService,
        ctx.httpServiceConfigProvider,
      );

      expect(service.shouldTraceServiceInvoke).toBeFalsy();
    });

    it('should return true if option is enabled', () => {
      ctx.httpServiceConfigProvider = {
        getConfig(): ServiceConfigType {
          return {
            enableTraceService: true,
          };
        },
      };

      const service = new HttpClientService(
        ctx.gotInstance,
        ctx.traceDataService,
        ctx.httpServiceConfigProvider,
      );

      expect(service.shouldTraceServiceInvoke).toBeTruthy();
    });
  });

  describe.each(['get', 'post', 'delete', 'head', 'put', 'patch'])(
    'Method invocation: %s',
    (method: string) => {
      it('Should not add headers if shouldTraceServiceInvoke is disabled', () => {
        ctx.gotInstance[method] = jest.fn();

        const service = new HttpClientService(
          ctx.gotInstance,
          ctx.traceDataService,
          ctx.httpServiceConfigProvider,
        );

        service[method]('');

        expect(ctx.gotInstance[method]).toBeCalledWith('', { headers: {} });
      });

      it('Should add trace headers if shouldTraceServiceInvoke is enabled', () => {
        ctx.gotInstance[method] = jest.fn();
        ctx.httpServiceConfigProvider = {
          getConfig(): ServiceConfigType {
            return {
              enableTraceService: true,
              headersMap: {
                traceId: 'x-trace-id',
              },
              excludeHeaders: [],
            };
          },
        };

        ctx.traceDataService.getRequestData = () => ({ traceId: 'testId' });

        const service = new HttpClientService(
          ctx.gotInstance,
          ctx.traceDataService,
          ctx.httpServiceConfigProvider,
        );

        service[method]('');

        expect(ctx.gotInstance[method]).toBeCalledWith('', {
          headers: { 'x-trace-id': 'testId' },
        });
      });
    },
  );
});
