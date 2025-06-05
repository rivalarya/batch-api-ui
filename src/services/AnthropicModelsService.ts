import BaseModelsService from './BaseModelsService';

class AnthropicModelsService extends BaseModelsService {
  protected readonly CACHE_KEY = 'anthropic_models_cache';

  /**
   * Fetch models from Anthropic API and cache them
   * @returns Promise that resolves to an array of model names
   */
  protected async fetchAndCacheModels(): Promise<string[]> {
    const apiKey = localStorage.getItem('anthropic_api_key');
    if (!apiKey) {
      throw new Error('API key not found. Please set your API key in the Settings section.');
    }

    try {
      const response = await fetch('/api/anthropic/v1/models', {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      const models = data.data.map((model: any) => model.id);

      // Cache the models
      this.cacheModels(models);

      return models;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }
}

export default new AnthropicModelsService();