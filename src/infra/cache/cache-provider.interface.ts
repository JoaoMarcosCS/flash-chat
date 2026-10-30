export interface ICacheProvider {
  /**
   * Busca um valor no cache pela chave.
   * Retorna null se a chave não existir ou estiver expirada.
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Grava um valor no cache.
   * @param key        - chave de lookup
   * @param value      - qualquer valor serializável em JSON
   * @param ttlSeconds - tempo de vida em segundos (padrão: 60)
   */
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;

  /**
   * Remove uma chave específica do cache.
   */
  invalidate(key: string): Promise<void>;

  /**
   * Remove todas as chaves que começam com o prefixo informado.
   * Útil para invalidar coleções inteiras (ex: "app:v1:module-1:x:*").
   */
  invalidateByPrefix(prefix: string): Promise<void>;

  /**
   * Adquire um lock distribuído sobre uma chave.
   * Usado para garantir idempotência: se a chave já estiver travada,
   * lança ConflictException imediatamente.
   *
   * Exemplo:
   *   await cache.setLock(payment.id);
   *   try {
   *     // processa o pagamento...
   *   } finally {
   *     await cache.releaseLock(payment.id);
   *   }
   */
  setLock(key: string, ttlSeconds?: number): Promise<void>;

  /**
   * Libera um lock adquirido com setLock.
   */
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
