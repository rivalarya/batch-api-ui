import { ApiService, BatchStatus, SavedBatchJob } from './interfaces';

interface AnthropicRequest {
  custom_id: string;
  params: {
    model: string;
    max_tokens: number;
    messages: Array<{
      role: string;
      content: string | Array<any>;
    }>;
  };
}

class AnthropicApiService implements ApiService {
  /**
   * Get the API key from local storage
   * @returns The API key or null if not found
   */
  getApiKey(): string | null {
    return localStorage.getItem('anthropic_api_key');
  }

  /**
   * Save the API key to local storage
   * @param apiKey - The API key to save
   */
  saveApiKey(apiKey: string): void {
    localStorage.setItem('anthropic_api_key', apiKey);
  }

  /**
   * Check if API key is valid (simple format validation)
   * @param apiKey - The API key to validate
   * @returns Whether the API key format is valid
   */
  isValidApiKeyFormat(apiKey: string): boolean {
    return Boolean(apiKey && apiKey.startsWith('sk-ant-'));
  }

  /**
   * Create a batch job with Anthropic
   * @param jsonlFile - The JSONL file with batch requests
   * @returns A promise that resolves to the batch job ID
   */
  async createBatchJob(jsonlFile: File): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API key not found. Please set your API key in the Settings section.');
    }

    // Read the JSONL file content
    const jsonlContent = await this._readFileContent(jsonlFile);

    // Parse JSONL and format for Anthropic's batch API
    const requests = this._parseJsonlToAnthropicFormat(jsonlContent);

    const response = await fetch('/api/anthropic/v1/messages/batches', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({ requests })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to create batch job');
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Parse JSONL content to Anthropic's batch API format
   * @param jsonlContent - The JSONL content
   * @returns Formatted requests for Anthropic's batch API
   */
  private _parseJsonlToAnthropicFormat(jsonlContent: string): AnthropicRequest[] {
    const lines = jsonlContent.split('\n').filter(line => line.trim());
    return lines.map(line => {
      try {
        const requestData = JSON.parse(line);

        // Check if this is already in Anthropic format
        if (requestData.params && requestData.params.messages) {
          return requestData;
        }

        // If it's in OpenAI format, convert it
        if (requestData.body && requestData.body.messages) {
          return {
            custom_id: requestData.custom_id || `req-${Math.random().toString(36).substring(2, 10)}`,
            params: {
              model: requestData.body.model || 'claude-3-5-sonnet-20240620',
              max_tokens: requestData.body.max_tokens || 1024,
              messages: requestData.body.messages
            }
          };
        }

        // Default structure
        return {
          custom_id: requestData.custom_id || `req-${Math.random().toString(36).substring(2, 10)}`,
          params: {
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1024,
            messages: [
              { role: "user", content: requestData.content || "No content provided" }
            ]
          }
        };
      } catch (e) {
        console.error('Error parsing JSON line:', e);
        return null;
      }
    }).filter((req): req is AnthropicRequest => req !== null);
  }

  /**
   * Read file content as text
   * @param file - The file to read
   * @returns A promise that resolves to the file content
   */
  private async _readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file: no result'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Get the status of a batch job
   * @param batchId - The ID of the batch job
   * @returns A promise that resolves to the batch status data
   */
  async getBatchStatus(batchId: string): Promise<BatchStatus> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API key not found. Please set your API key in the Settings section.');
    }

    const response = await fetch(`/api/anthropic/v1/messages/batches/${batchId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Failed to fetch batch status: ${response.status}`);
    }

    const data = await response.json();

    // Map to standardized format
    return {
      id: data.id,
      status: this._mapStatusToCommon(data.processing_status),
      created_at: data.created_at,
      completed_at: data.ended_at,
      eta: data.expires_at,
      output_file_id: null, // Will be set when downloading
      input_file_id: null,
      request_counts: data.request_counts,
      total_count: data.request_counts?.processing +
        data.request_counts?.succeeded +
        data.request_counts?.errored +
        data.request_counts?.canceled +
        data.request_counts?.expired,
      results_url: data.results_url,
      endpoint: '/v1/messages',
      completion_window: '24h'
    };
  }

  /**
   * Map Anthropic status to common status format
   * @param status - Anthropic status
   * @returns Common status format
   */
  private _mapStatusToCommon(status: string): string {
    switch (status) {
      case 'ended':
        return 'completed';
      case 'in_progress':
        return 'in_progress';
      case 'canceling':
        return 'in_progress';
      case 'canceled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  /**
   * Cancel a batch job
   * @param batchId - The ID of the batch job to cancel
   * @returns A promise that resolves to the cancellation result
   */
  async cancelBatchJob(batchId: string): Promise<any> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API key not found. Please set your API key in the Settings section.');
    }

    const response = await fetch(`/api/anthropic/v1/messages/batches/${batchId}/cancel`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Failed to cancel batch: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * List all batches
   * @param limit - Maximum number of batches to retrieve
   * @returns A promise that resolves to an array of batch data
   */
  async listBatches(limit = 10): Promise<BatchStatus[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API key not found. Please set your API key in the Settings section.');
    }

    const response = await fetch(`/api/anthropic/v1/messages/batches?limit=${limit}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Failed to fetch batch list: ${response.status}`);
    }

    const data = await response.json();

    // Format to match standardized structure
    return data.data.map((batch: any) => ({
      id: batch.id,
      status: this._mapStatusToCommon(batch.processing_status),
      created_at: batch.created_at,
      completed_at: batch.ended_at,
      eta: batch.expires_at,
      input_file_id: null,
      output_file_id: null,
      results_url: batch.results_url,
      endpoint: '/v1/messages',
      completion_window: '24h'
    }));
  }

  /**
   * Download batch results
   * @param batchId - The ID of the batch job
   * @returns A promise that resolves to the results content
   */
  async downloadFileContent(batchId: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API key not found. Please set your API key in the Settings section.');
    }

    // First, get the batch status to get the results URL
    const batchStatus = await this.getBatchStatus(batchId);

    if (!batchStatus.results_url) {
      throw new Error('Results are not yet available for this batch');
    }

    // Get the results directly from Anthropic's API
    const response = await fetch(`/api/anthropic/v1/messages/batches/${batchId}/results`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download results: ${response.status}`);
    }

    return await response.text();
  }

  /**
   * Save batch information to local storage
   * @param batchData - The batch data to save
   */
  saveBatchInfo(batchData: Partial<SavedBatchJob>): void {
    // Load existing batch info
    let batchJobs: SavedBatchJob[] = [];
    const savedBatchJobs = localStorage.getItem('anthropic_batch_jobs');
    if (savedBatchJobs) {
      try {
        batchJobs = JSON.parse(savedBatchJobs);
      } catch (e) {
        batchJobs = [];
      }
    }

    if (!batchData.id) {
      console.error('Cannot save batch info without an ID');
      return;
    }

    // Add new batch info or update existing one
    const existingBatchIndex = batchJobs.findIndex(batch => batch.id === batchData.id);
    if (existingBatchIndex >= 0) {
      batchJobs[existingBatchIndex] = {
        ...batchJobs[existingBatchIndex],
        ...batchData,
        lastChecked: new Date().toISOString()
      };
    } else {
      const newBatch = {
        id: batchData.id,
        status: batchData.status || 'pending',
        created_at: batchData.created_at || new Date().toISOString(),
        completed_at: batchData.completed_at || null,
        eta: batchData.eta || null,
        output_file_id: batchData.output_file_id || null,
        input_file_id: batchData.input_file_id || null,
        request_counts: batchData.request_counts || {},
        total_count: batchData.total_count || 0,
        results_url: batchData.results_url,
        endpoint: batchData.endpoint || '/v1/messages',
        completion_window: batchData.completion_window || '24h',
        date: batchData.date || new Date().toISOString(),
        lastChecked: new Date().toISOString()
      };
      batchJobs.push(newBatch);
    }

    // Sort by date descending
    batchJobs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Save back to local storage
    localStorage.setItem('anthropic_batch_jobs', JSON.stringify(batchJobs));
  }

  /**
   * Get all saved batch jobs from local storage
   * @returns An array of saved batch jobs
   */
  getSavedBatchJobs(): SavedBatchJob[] {
    const savedBatchJobs = localStorage.getItem('anthropic_batch_jobs');
    if (savedBatchJobs) {
      try {
        return JSON.parse(savedBatchJobs);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  /**
   * Update multiple batch records in storage
   * @param batches - Array of batch data to update
   */
  updateBatchesInStorage(batches: any[]): void {
    if (!Array.isArray(batches) || batches.length === 0) return;

    // Get existing batches
    let existingBatches = this.getSavedBatchJobs();

    // Create a map for quick lookup
    const existingBatchMap = existingBatches.reduce<Record<string, SavedBatchJob>>((map, batch) => {
      map[batch.id] = batch;
      return map;
    }, {});

    // Merge new batches with existing ones
    for (const batch of batches) {
      existingBatchMap[batch.id] = {
        id: batch.id,
        status: this._mapStatusToCommon(batch.processing_status || batch.status),
        created_at: batch.created_at,
        completed_at: batch.ended_at || batch.completed_at || null,
        eta: batch.expires_at || batch.eta || null,
        input_file_id: null,
        output_file_id: null,
        results_url: batch.results_url,
        endpoint: '/v1/messages',
        completion_window: '24h',
        date: batch.created_at,
        lastChecked: new Date().toISOString()
      };
    }

    // Convert map back to array
    const updatedBatches = Object.values(existingBatchMap);

    // Sort by date descending
    updatedBatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Save back to localStorage
    localStorage.setItem('anthropic_batch_jobs', JSON.stringify(updatedBatches));
  }
}

export default new AnthropicApiService();