// Standardized batch status response structure
export interface BatchStatus {
  id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  eta: string | null;
  output_file_id: string | null;
  input_file_id: string | null;
  request_counts?: {
    processing?: number;
    succeeded?: number;
    errored?: number;
    canceled?: number;
    expired?: number;
    total?: number;
    completed?: number;
    failed?: number;
  };
  total_count?: number;
  results_url?: string;
  endpoint: string;
  completion_window: string;
}

// Batch job information saved in localStorage
export interface SavedBatchJob extends BatchStatus {
  date: string;
  lastChecked: string;
}

// API Service interface that both providers will implement
export interface ApiService {
  getApiKey(): string | null;
  saveApiKey(apiKey: string): void;
  isValidApiKeyFormat(apiKey: string): boolean;
  createBatchJob(file: File, endpoint?: string, completionWindow?: string): Promise<string>;
  getBatchStatus(batchId: string): Promise<BatchStatus>;
  cancelBatchJob(batchId: string): Promise<any>;
  listBatches(limit?: number): Promise<BatchStatus[]>;
  downloadFileContent(fileIdOrBatchId: string): Promise<string>;
  saveBatchInfo(batchData: Partial<SavedBatchJob>): void;
  getSavedBatchJobs(): SavedBatchJob[];
  updateBatchesInStorage(batches: any[]): void;
}