import { Module } from '@nestjs/common';
import { httpServiceConfigMock } from './config-module.config.mock';

export const MODULE_CONFIG_TOKEN = 'MODULE_CONFIG_TOKEN';

@Module({
  providers: [
    {
      provide: MODULE_CONFIG_TOKEN,
      useValue: httpServiceConfigMock,
    },
  ],
  exports: [MODULE_CONFIG_TOKEN],
})
export class ConfigModuleMock {}
