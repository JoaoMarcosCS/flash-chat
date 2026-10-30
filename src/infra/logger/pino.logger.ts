import type { Logger } from 'pino';
import { ILogger, LogData } from './logger.interface';

export class PinoLogger implements ILogger {
  constructor(private readonly instance: Logger) {}

  debug(message: string, data: LogData = {}): void {
    this.instance.debug(data, message);
  }

  info(message: string, data: LogData = {}): void {
    this.instance.info(data, message);
  }

  warn(message: string, data: LogData = {}): void {
    this.instance.warn(data, message);
  }

  error(message: string, data: LogData = {}): void {
    this.instance.error(data, message);
  }

  child(context: string): ILogger {
    return new PinoLogger(this.instance.child({ context }));
  }
}
