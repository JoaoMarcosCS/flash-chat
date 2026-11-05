export interface ICacheProvider {
  get<T>(key: string): Promise<T | null>;

  getAndDelete<T>(key: string): Promise<T | null>;

  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;

  invalidate(key: string): Promise<void>;

  invalidateByPrefix(prefix: string): Promise<void>;

  setLock(key: string, ttlSeconds?: number): Promise<void>;

  releaseLock(key: string): Promise<void>;

  /**
   * Padrão cache-aside com lock distribuído de tentativa única.
   *
   * Fluxo:
   *   1. Tenta buscar no cache.
   *   2. Cache hit → retorna imediatamente.
   *   3. Cache miss → tenta adquirir lock (SET NX). Se já estiver tomado,
   *      lança ConflictException imediatamente (sem fila, sem espera).
   *   4. Com o lock, executa fn(), grava o resultado no cache e libera o lock.
   *
   */
  getWithLock<T>(key: string, fn: () => Promise<T>, ttlSeconds?: number): Promise<T>;
}
