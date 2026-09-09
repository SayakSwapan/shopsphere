interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Simple module-level time-to-live cache. In serverless environments each
 * warm instance keeps a copy, so repeated reads (e.g. site settings across
 * layout / page / navbar / footer) hit the database only once per window
 * instead of on every render — and a warm instance serves them instantly.
 */
export class TtlCache<T> {
  private entry: CacheEntry<T> | null = null;

  constructor(private readonly ttlMs: number) {}

  async get(loader: () => Promise<T>): Promise<T> {
    if (this.entry && this.entry.expiresAt > Date.now()) {
      return this.entry.value;
    }
    const value = await loader();
    this.entry = { value, expiresAt: Date.now() + this.ttlMs };
    return value;
  }

  clear(): void {
    this.entry = null;
  }
}