import { inject, injectable } from 'tsyringe';
import { createClient } from 'redis';
import { ICacheProvider } from './cache-provider.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { env } from '@/shared/environment/env';
import {
  BadRequestException,
  ConflictException,
  InternalServerException,
} from '@/shared/errors/errors';

type RedisClient = ReturnType<typeof createClient>;

@injectable()
export class RedisCacheProvider implements ICacheProvider {
  private client: RedisClient;
  private logger: ILogger;

  // O tsyringe garante que este construtor é chamado uma única vez atraves do registerSingleton,
  // portanto existe apenas uma conexão Redis durante toda a vida da aplicação.
  constructor(@inject('ILogger') logger: ILogger) {
    this.logger = logger.child('RedisCacheProvider');

    this.client = createClient({
      socket: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,

        // Estratégia de reconexão com backoff exponencial.
        // Chamada automaticamente pelo cliente a cada falha de conexão.
        // - retries: quantas tentativas já foram feitas
        // - Retornar um número → aguarda esse delay (ms) antes da próxima tentativa
        // - Retornar um Error → para de tentar e emite o erro no evento 'error'
        reconnectStrategy(retries) {
          const MAX_RETRIES = 5;
          if (retries >= MAX_RETRIES) {
            return new InternalServerException(
              `[RedisCacheProvider] gave up after ${MAX_RETRIES} reconnection attempts`,
            );
          }
          // Backoff exponencial: 100ms, 200ms, 400ms... com teto de 5s.
          // Evita sobrecarregar o Redis com flood de reconexões.
          const delay = Math.min(100 * 2 ** retries, 5000);
          return delay;
        },
      },
    });

    this.client.on('error', (err) => {
      this.logger.error('connection error', { err });
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('reconnecting to Redis');
    });

    this.client.on('ready', () => {
      this.logger.info('connection established');
    });

    // Conecta de forma assíncrona — o método connect() é idempotente:
    // se a conexão já estiver ativa, não reabre.
    this.client.connect().catch((err) => {
      this.logger.error('failed to connect', { err });
    });
  }

  // Enquanto o cliente estiver reconectando, isReady é false.
  // Todos os métodos verificam isso antes de operar: cache nunca
  // deve derrubar uma requisição — falha silenciosa é o comportamento correto.
  private get isReady(): boolean {
    return this.client.isReady;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady) return null;
    try {
      const raw = await this.client.get(key);

      if (raw === null || raw === undefined) return null;

      return JSON.parse(raw as string) as T;
    } catch (err) {
      // Cache miss por erro não deve derrubar a requisição.
      this.logger.error('get error', { err, key });
      return null;
    }
  }

  async getAndDelete<T>(key: string): Promise<T | null> {
    if (!this.isReady) return null;
    try {
      const raw = await this.client.getDel(key);

      if (raw === null || raw === undefined) return null;

      return JSON.parse(raw as string) as T;
    } catch (err) {
      this.logger.error('getAndDelete error', { err, key });
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    if (!this.isReady) return;
    try {
      const serialized = JSON.stringify(value);
      await this.client.set(key, serialized, { EX: ttlSeconds });
    } catch (err) {
      this.logger.error('set error', { err, key });
    }
  }

  async invalidate(key: string): Promise<void> {
    if (!this.isReady) return;
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.error('invalidate error', { err, key });
    }
  }

  async invalidateByPrefix(prefix: string): Promise<void> {
    if (!this.isReady) return;
    try {
      // SCAN é não-bloqueante, ao contrário do KEYS.
      // Itera em lotes para não travar o event loop do Redis em produção.
      // No redis@5, o cursor é uma string (inicia em '0', termina quando volta '0').
      let cursor = '0';
      do {
        const reply = await this.client.scan(cursor, {
          MATCH: `${prefix}*`,
          COUNT: 100,
        });

        cursor = reply.cursor.toString();

        if (reply.keys.length > 0) {
          await this.client.del(reply.keys);
        }
      } while (cursor !== '0');
    } catch (err) {
      this.logger.error('invalidateByPrefix error', { err, prefix });
    }
  }

  async setLock(key: string, ttlSeconds = 30): Promise<void> {
    const lockKey = `lock:${key}`;

    const acquired = this.isReady
      ? await this.client.set(lockKey, '1', { NX: true, EX: ttlSeconds }).catch(() => null)
      : null;

    if (!acquired) {
      throw new ConflictException(
        `O recurso "${key}" já está sendo processado. Tente novamente em instantes.`,
      );
    }
  }

  async releaseLock(key: string): Promise<void> {
    if (!this.isReady) return;
    try {
      await this.client.del(`lock:${key}`);
    } catch (err) {
      this.logger.error('releaseLock error', { err, key });
    }
  }

  async getWithLock<T>(key: string, fn: () => Promise<T>, ttlSeconds = 60): Promise<T> {
    // 1. Tenta o cache primeiro. Se Redis estiver fora, vai direto para fn().
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    // 2. Cache miss — tenta adquirir o lock uma única vez.
    // SET lock:<key> 1 NX EX 5 → só uma requisição consegue gravar (NX = only if Not eXists).
    // Diferente de uma fila, aqui não há espera: se o lock já estiver tomado, retorna erro imediatamente.
    if (!this.isReady) return fn();

    const lockKey = `lock:${key}`;

    const acquired = await this.client.set(lockKey, '1', { NX: true, EX: 5 });

    if (!acquired) {
      throw new BadRequestException(
        `O recurso já está sendo processado. Tente novamente em instantes.`,
      );
    }

    // 3. Somos a requisição eleita — buscamos o dado na fonte real.
    try {
      const value = await fn();
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttlSeconds);
      }
      return value;
    } finally {
      // Libera o lock mesmo se fn() lançar exceção.
      await this.releaseLock(key);
    }
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
