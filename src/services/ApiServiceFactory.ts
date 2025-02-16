import { ApiService } from './interfaces';
import OpenAIApiService from './OpenaiApiService';
import AnthropicApiService from './AnthropicApiService';

/**
 * Factory class to provide the appropriate API service
 */
class ApiServiceFactory {
  /**
   * Get the appropriate API service based on the provider
   * @param provider - The provider name ('openai' or 'anthropic')
   * @returns The API service for the specified provider
   */
  getService(provider: string): ApiService {
    switch (provider) {
      case 'openai':
        return OpenAIApiService;
      case 'anthropic':
        return AnthropicApiService;
      default:
        // Default to OpenAI if no provider specified
        return OpenAIApiService;
    }
  }
}

export default new ApiServiceFactory();