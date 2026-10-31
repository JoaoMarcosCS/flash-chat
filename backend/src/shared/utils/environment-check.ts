import { env } from '../environment/env';

export const environmentCheck = (environment: typeof env.ENVIRONMENT) => {
  return env.ENVIRONMENT === environment;
};
