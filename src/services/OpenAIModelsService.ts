import BaseModelsService from './BaseModelsService';

class OpenAIModelsService extends BaseModelsService {
  protected readonly CACHE_KEY = 'openai_models_cache';

  /**
   * Fetch models from OpenAI API and cache them
   * @returns Promise that resolves to an array of model names
   */
  protected async fetchAndCacheModels(): Promise<string[]> {
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
      throw new Error('API key not found. Please set your API key in the Settings section.');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      const codingModelPatterns = [
        'gpt-4',
        'gpt-4o',
        'gpt-3.5-turbo',
        'o1-preview',
        'o1-mini'
      ];

      const models = data.data
        .filter((model: any) =>
          codingModelPatterns.some(pattern => model.id.includes(pattern))
        )
        .map((model: any) => model.id)
        .sort((a: string, b: string) => b.localeCompare(a));

      this.cacheModels(models);
      return models;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }
}

export default new OpenAIModelsService();