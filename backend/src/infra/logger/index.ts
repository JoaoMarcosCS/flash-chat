import { PinoLogger } from './pino.logger';
import { pinoInstance } from './pino';

export const logger = new PinoLogger(pinoInstance);
