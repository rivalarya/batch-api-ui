export interface CachedModels {
  models: string[];
  timestamp: number;
}

abstract class BaseModelsService {
  protected abstract readonly CACHE_KEY: string;
  protected readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  /**
   * Get the cached models or fetch new ones if cache is expired
   * @returns Promise that resolves to an array of model names
   */
  async getModels(): Promise<string[]> {
    const cached = this.getCachedModels();
    if (cached && !this.isCacheExpired(cached.timestamp)) {
      return cached.models;
    }

    return this.fetchAndCacheModels();
  }

  /**
   * Force refresh the models cache
   * @returns Promise that resolves to an array of model names
   */
  async refreshModels(): Promise<string[]> {
    return this.fetchAndCacheModels();
  }

  /**
   * Clear the models cache
   */
  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }

  /**
   * Get the cached models from localStorage
   * @returns The cached models or null if not found
   */
  protected getCachedModels(): CachedModels | null {
    const cached = localStorage.getItem(this.CACHE_KEY);
    if (!cached) return null;

    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error('Error parsing cached models:', e);
      return null;
    }
  }

  /**
   * Check if the cache is expired
   * @param timestamp - The cache timestamp
   * @returns Whether the cache is expired
   */
  protected isCacheExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.CACHE_DURATION;
  }

  /**
   * Cache the models
   * @param models - Array of model names to cache
   */
  protected cacheModels(models: string[]): void {
    const cache: CachedModels = {
      models,
      timestamp: Date.now()
    };
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
  }

  /**
   * Fetch models from API and cache them
   * @returns Promise that resolves to an array of model names
   */
  protected abstract fetchAndCacheModels(): Promise<string[]>;
}

export default BaseModelsService;