import { ServiceConfigType } from './types/config.types';

export interface HttpServiceConfigProviderInterface {
  getConfig(): ServiceConfigType;
}
