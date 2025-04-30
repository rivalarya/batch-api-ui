import { ApiService, BatchStatus, SavedBatchJob } from './interfaces';

interface OpenAIBatchResponse {
  id: string;
  object: string;
  endpoint: string;
  errors: any;
  input_file_id: string;
  completion_window: string;
  status: string;
  output_file_id: string | null;
  error_file_id: string | null;
  created_at: number;
  in_progress_at: number | null;
  expires_at: number | null;
  completed_at: number | null;
  failed_at: number | null;
  expired_at: number | null;
  request_counts: {
    total: number;
    completed: number;
    failed: number;
  };
  metadata: any;
}

class OpenAIApiService implements ApiService {
  /**
   * Get the API key from local storage
   * @returns The API key or null if not found
   */
  getApiKey(): string | null {
    return localStorage.getItem('openai_api_key');
  }

  /**
   * Save the API key to local storage
   * @param apiKey - The API key to save
   */
  saveApiKey(apiKey: string): void {
    localStorage.setItem('openai_api_key', apiKey);
  }

  /**
   * Check if API key is valid (simple format validation)
   * @param apiKey - The API key to validate
   * @returns Whether the API key format is valid
   */
  isValidApiKeyFormat(apiKey: string): boolean {
    return Boolean(apiKey && apiKey.startsWith('sk-'));
  }

  /**
   * Upload a file to OpenAI for batch processing
   * @param file - The file to upload
   * @returns A promise that resolves to the file ID
   */
  async uploadFile(file: File): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API key not found. Please set your API key in the Create Batch section.');
    }

    const formData = new FormData();
    formData.append('purpose', 'batch');
    formData.append('file', file);

    const response = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload file');
    }

    const data = await response.json();
    return data.id;
  }

  /**
 * Create a batch job with OpenAI
 * @param fileIdOrFile - The file ID or File object
 * @param endpoint - The API endpoint to use (default: /v1/chat/completions)
 * @param completionWindow - Time window for batch completion (default: 24h)
 * @returns A promise that resolves to the batch job ID
 */
  async createBatchJob(fileIdOrFile: string | File, endpoint = '/v1/chat/completions', completionWindow = '24h'): Promise<string> {
    let fileId: string;

    if (typeof fileIdOrFile === 'string') {
      fileId = fileIdOrFile;
    } else {
      fileId = await this.uploadFile(fileIdOrFile);
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API key not found. Please set your API key in the Create Batch section.');
    }

    const response = await fetch('https://api.openai.com/v1/batches', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input_file_id: fileId,
        endpoint: endpoint,
        completion_window: completionWindow
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to create batch job');
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Get the status of a batch job
   * @param batchId - The ID of the batch job
   * @returns A promise that resolves to the batch status data
   */
  async getBatchStatus(batchId: string): Promise<BatchStatus> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API key not found. Please set your API key in the Create Batch section.');
    }

    const response = await fetch(`https://api.openai.com/v1/batches/${batchId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Failed to fetch batch status: ${response.status}`);
    }

    const data = await response.json() as OpenAIBatchResponse;

    return {
      id: data.id,
      status: this._mapStatusToCommon(data.status),
      created_at: this._convertUnixTimestampToIso(data.created_at),
      completed_at: data.completed_at ? this._convertUnixTimestampToIso(data.completed_at) : null,
      eta: data.expires_at ? this._convertUnixTimestampToIso(data.expires_at) : null,
      output_file_id: data.output_file_id,
      input_file_id: data.input_file_id,
      request_counts: {
        succeeded: data.request_counts?.completed || 0,
        errored: data.request_counts?.failed || 0,
        total: data.request_counts?.total || 0
      },
      total_count: data.request_counts?.total || 0,
      endpoint: data.endpoint,
      completion_window: data.completion_window
    };
  }

  /**
   * Convert Unix timestamp to ISO string
   * @param timestamp - Unix timestamp in seconds
   * @returns ISO string date
   */
  private _convertUnixTimestampToIso(timestamp: number): string {
    return new Date(timestamp * 1000).toISOString();
  }

  /**
   * Map OpenAI status to common status format
   * @param status - OpenAI status
   * @returns Common status format
   */
  private _mapStatusToCommon(status: string): string {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'processing':
      case 'in_progress':
        return 'in_progress';
      case 'validating':
        return 'pending';
      case 'cancelling':
        return 'in_progress';
      case 'cancelled':
        return 'cancelled';
      case 'failed':
        return 'failed';
      case 'expired':
        return 'expired';
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
      throw new Error('API key not found. Please set your API key in the Create Batch section.');
    }

    const response = await fetch(`https://api.openai.com/v1/batches/${batchId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Failed to cancel batch: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * List all batches (limited to 10 by default)
   * @param limit - Maximum number of batches to retrieve
   * @returns A promise that resolves to an array of batch data
   */
  async listBatches(limit = 10): Promise<BatchStatus[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API key not found. Please set your API key in the Create Batch section.');
    }

    const response = await fetch(`https://api.openai.com/v1/batches?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Failed to fetch batch list: ${response.status}`);
    }

    const data = await response.json();

    return data.data.map((batch: OpenAIBatchResponse) => ({
      id: batch.id,
      status: this._mapStatusToCommon(batch.status),
      created_at: this._convertUnixTimestampToIso(batch.created_at),
      completed_at: batch.completed_at ? this._convertUnixTimestampToIso(batch.completed_at) : null,
      eta: batch.expires_at ? this._convertUnixTimestampToIso(batch.expires_at) : null,
      output_file_id: batch.output_file_id,
      input_file_id: batch.input_file_id,
      endpoint: batch.endpoint,
      completion_window: batch.completion_window
    }));
  }

  /**
   * Download batch results file
   * @param fileId - The ID of the file to download
   * @returns A promise that resolves to the file content
   */
  async downloadFileContent(fileId: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API key not found. Please set your API key in the Create Batch section.');
    }

    const response = await fetch(`https://api.openai.com/v1/files/${fileId}/content`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
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
    let batchJobs: SavedBatchJob[] = [];
    const savedBatchJobs = localStorage.getItem('openai_batch_jobs');
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

    const existingBatchIndex = batchJobs.findIndex(batch => batch.id === batchData.id);
    if (existingBatchIndex >= 0) {
      batchJobs[existingBatchIndex] = {
        ...batchJobs[existingBatchIndex],
        ...batchData,
        lastChecked: new Date().toISOString()
      };
    } else {
      const newBatch: SavedBatchJob = {
        id: batchData.id,
        status: batchData.status || 'pending',
        created_at: batchData.created_at || new Date().toISOString(),
        completed_at: batchData.completed_at || null,
        eta: batchData.eta || null,
        output_file_id: batchData.output_file_id || null,
        input_file_id: batchData.input_file_id || null,
        request_counts: batchData.request_counts || {},
        total_count: batchData.total_count || 0,
        endpoint: batchData.endpoint || '/v1/chat/completions',
        completion_window: batchData.completion_window || '24h',
        date: batchData.date || new Date().toISOString(),
        lastChecked: new Date().toISOString(),
        results_url: batchData.results_url
      };
      batchJobs.push(newBatch);
    }

    batchJobs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    localStorage.setItem('openai_batch_jobs', JSON.stringify(batchJobs));
  }

  /**
   * Get all saved batch jobs from local storage
   * @returns An array of saved batch jobs
   */
  getSavedBatchJobs(): SavedBatchJob[] {
    const savedBatchJobs = localStorage.getItem('openai_batch_jobs');
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

    let existingBatches = this.getSavedBatchJobs();

    const existingBatchMap = existingBatches.reduce<Record<string, SavedBatchJob>>((map, batch) => {
      map[batch.id] = batch;
      return map;
    }, {});

    for (const batch of batches) {
      existingBatchMap[batch.id] = {
        id: batch.id,
        status: this._mapStatusToCommon(batch.status),
        created_at: typeof batch.created_at === 'number'
          ? this._convertUnixTimestampToIso(batch.created_at)
          : batch.created_at,
        completed_at: batch.completed_at
          ? (typeof batch.completed_at === 'number'
            ? this._convertUnixTimestampToIso(batch.completed_at)
            : batch.completed_at)
          : null,
        eta: batch.expires_at
          ? (typeof batch.expires_at === 'number'
            ? this._convertUnixTimestampToIso(batch.expires_at)
            : batch.expires_at)
          : null,
        input_file_id: batch.input_file_id,
        output_file_id: batch.output_file_id,
        request_counts: {
          succeeded: batch.request_counts?.completed || 0,
          errored: batch.request_counts?.failed || 0,
          total: batch.request_counts?.total || 0
        },
        total_count: batch.request_counts?.total || 0,
        endpoint: batch.endpoint || '/v1/chat/completions',
        completion_window: batch.completion_window || '24h',
        date: typeof batch.created_at === 'number'
          ? this._convertUnixTimestampToIso(batch.created_at)
          : (batch.created_at || new Date().toISOString()),
        lastChecked: new Date().toISOString(),
        results_url: batch.results_url
      };
    }

    const updatedBatches = Object.values(existingBatchMap);

    updatedBatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    localStorage.setItem('openai_batch_jobs', JSON.stringify(updatedBatches));
  }
}

export default new OpenAIApiService();