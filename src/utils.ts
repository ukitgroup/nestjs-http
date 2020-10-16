import { Provider } from '@nestjs/common';

export function uniqueProvidersByToken(providers: Provider[]): Provider[] {
  return [
    ...new Map(
      providers.map(provider => {
        const token =
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          typeof provider.provide !== 'undefined' ? provider.provide : provider;
        return [token, provider];
      }),
    ).values(),
  ];
}
