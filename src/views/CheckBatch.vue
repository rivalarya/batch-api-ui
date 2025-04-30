<!-- CheckBatch.vue -->
<template>
  <div class="max-w-7xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Batch List Section (Left Side) -->
      <div class="md:col-span-1">
        <Card class="shadow-lg mb-6 h-full">
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <i class="pi pi-list mr-2"></i>
                <span>{{ providerName }} Batch Jobs</span>
              </div>

              <!-- Provider Selector -->
              <Dropdown v-model="selectedProvider" :options="providerOptions" optionLabel="name" optionValue="value"
                class="w-auto text-sm" @change="onProviderChange" />
            </div>
          </template>

          <template #content>
            <div class="mb-4">
              <div class="p-field">
                <label for="batchId" class="block mb-2 font-medium">Batch ID</label>
                <div class="flex gap-2">
                  <InputText id="batchId" v-model="batchId" class="w-full" placeholder="Enter batch ID to check" />
                  <Button icon="pi pi-search" @click="checkBatchStatus" :disabled="!batchId || isLoading"
                    :loading="isLoading" />
                </div>
              </div>
            </div>

            <Divider v-if="recentBatchJobs.length > 0" />

            <div v-if="recentBatchJobs.length > 0" class="mt-4">
              <h3 class="text-lg font-semibold mb-2">Recent Batch Jobs</h3>
              <div class="h-80 overflow-y-auto pr-2">
                <div class="grid grid-cols-1 gap-2">
                  <div v-for="batch in recentBatchJobs" :key="batch.id"
                    class="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                    :class="{ 'bg-blue-50': batchId === batch.id }" @click="selectBatch(batch.id)">
                    <div>
                      <span class="font-mono text-sm">{{ batch.id }}</span>
                      <div class="text-xs text-gray-600">{{ formatDate(batch.date) }}</div>
                      <div class="text-xs" :class="{
                        'text-green-600': batch.status === 'completed',
                        'text-yellow-600': batch.status === 'in_progress',
                        'text-blue-600': batch.status === 'pending',
                        'text-red-600': batch.status === 'failed' || batch.status === 'cancelled'
                      }">{{ formatStatus(batch.status) }}</div>
                    </div>
                    <Button icon="pi pi-search" text rounded @click.stop="selectBatch(batch.id)" />
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4">
              <Button label="List All Batches" icon="pi pi-list" class="w-full" @click="fetchAllBatches"
                :loading="isListLoading" :disabled="isListLoading" />
            </div>
          </template>
        </Card>
      </div>

      <!-- Results Section (Right Side) -->
      <div class="md:col-span-2">
        <div v-if="batchStatus" class="mb-6">
          <Card class="shadow-lg">
            <template #title>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <i class="pi pi-list mr-2"></i>
                  <span>{{ providerName }} Batch Status: {{ batchId }}</span>
                </div>
                <div v-if="batchStatus.status !== 'completed' && batchStatus.status !== 'failed'">
                  <Button label="Cancel Batch" icon="pi pi-times" severity="danger" @click="confirmCancelBatch"
                    outlined />
                </div>
              </div>
            </template>

            <template #content>
              <div class="mb-4">
                <div class="flex items-center mb-2">
                  <div class="w-3 h-3 rounded-full mr-2" :class="{
                    'bg-green-500': batchStatus.status === 'completed',
                    'bg-yellow-500': batchStatus.status === 'in_progress',
                    'bg-blue-500': batchStatus.status === 'pending',
                    'bg-red-500': batchStatus.status === 'failed' || batchStatus.status === 'cancelled'
                  }"></div>
                  <span class="font-medium">Status: {{ formatStatus(batchStatus.status) }}</span>

                  <Button
                    v-if="batchStatus.status !== 'completed' && batchStatus.status !== 'failed' && batchStatus.status !== 'cancelled'"
                    icon="pi pi-refresh" text rounded class="ml-auto" @click="checkBatchStatus" :loading="isLoading" />
                </div>

                <ProgressBar v-if="['in_progress', 'pending'].includes(batchStatus.status)"
                  :value="calculateProgress(batchStatus)" class="h-2 mb-2" />

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div class="bg-gray-50 p-3 rounded">
                    <div class="text-sm text-gray-600">Created</div>
                    <div>{{ formatDate(batchStatus.created_at) }}</div>
                  </div>

                  <div class="bg-gray-50 p-3 rounded">
                    <div class="text-sm text-gray-600">
                      {{ batchStatus.status === 'completed' ? 'Completed At' : 'Estimated Completion' }}
                    </div>
                    <div>{{ formatDate(batchStatus.status === 'completed' ? batchStatus.completed_at : batchStatus.eta)
                    }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-gray-50 p-4 rounded mb-4">
                <h3 class="text-lg font-semibold mb-2">Batch Details</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div class="text-sm">
                      <div class="flex justify-between py-1 border-b border-gray-200">
                        <span class="font-medium">Provider:</span>
                        <span>{{ providerName }}</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-gray-200">
                        <span class="font-medium">Input file ID:</span>
                        <span class="font-mono">{{ batchStatus.input_file_id || 'N/A' }}</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-gray-200">
                        <span class="font-medium">Endpoint:</span>
                        <span>{{ batchStatus.endpoint || 'N/A' }}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div class="text-sm">
                      <div class="flex justify-between py-1 border-b border-gray-200">
                        <span class="font-medium">Output file:</span>
                        <span>{{ (batchStatus.output_file_id || batchStatus.results_url) ? 'Available' : 'Not available'
                        }}</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-gray-200">
                        <span class="font-medium">Completion window:</span>
                        <span>{{ batchStatus.completion_window || 'N/A' }}</span>
                      </div>
                      <div class="flex justify-between items-center py-1 border-b border-gray-200">
                        <span class="font-medium">Processed count:</span>
                        <span class="flex gap-2">
                          <Button size="small" icon="pi pi-info-circle" severity="info" text
                            @click="statusPopover.toggle($event)" />
                          <Popover ref="statusPopover" appendTo="body">
                            <div class="flex flex-col gap-4 w-[20rem] p-2">
                              <div>
                                <span class="font-medium block mb-2">Batch Status Overview</span>
                                <span class="font-medium">Total request: </span>
                                <span>{{ batchStatus.total_count || 'N/A' }}</span>
                                <ul class="list-none p-0 m-0 flex flex-col gap-3">
                                  <li v-if="batchStatus.request_counts?.succeeded" class="flex items-center gap-2">
                                    <i class="pi pi-check text-green-500 text-xl"></i>
                                    <div>
                                      <span class="font-medium">{{ batchStatus.request_counts.succeeded }}
                                        succeeded</span>
                                    </div>
                                  </li>
                                  <li v-if="batchStatus.request_counts?.errored" class="flex items-center gap-2">
                                    <i class="pi pi-times text-red-500 text-xl"></i>
                                    <div>
                                      <span class="font-medium">{{ batchStatus.request_counts.errored }} failed</span>
                                    </div>
                                  </li>
                                  <li v-if="batchStatus.request_counts?.processing" class="flex items-center gap-2">
                                    <i class="pi pi-spinner text-blue-500 text-xl animate-spin"></i>
                                    <div>
                                      <span class="font-medium">{{ batchStatus.request_counts.processing }}
                                        processing</span>
                                    </div>
                                  </li>
                                  <li v-if="batchStatus.request_counts?.canceled" class="flex items-center gap-2">
                                    <i class="pi pi-ban text-yellow-500 text-xl"></i>
                                    <div>
                                      <span class="font-medium">{{ batchStatus.request_counts.canceled }}
                                        cancelled</span>
                                    </div>
                                  </li>
                                </ul>
                              </div>
                              <div v-if="getTotalTasks() > 0" class="mt-2">
                                <div class="flex justify-between mb-2">
                                  <span class="font-medium">Overall Progress</span>
                                  <span>{{ getCompletionPercentage() }}%</span>
                                </div>
                                <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                                  <div class="bg-primary h-2 rounded-full"
                                    :style="{ width: getCompletionPercentage() + '%' }"></div>
                                </div>
                              </div>
                            </div>
                          </Popover>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="batchStatus.output_file_id || batchStatus.results_url">
                <h3 class="text-lg font-semibold mb-2">{{ provider === 'openai' ? 'Output File' : 'Results' }}</h3>
                <div class="bg-gray-50 p-3 rounded mb-4 flex justify-between items-center">
                  <div>
                    <div class="font-medium font-mono">{{ batchStatus.output_file_id || 'Results available' }}</div>
                    <div class="text-xs text-gray-600">
                      {{ batchStatus.status === 'completed' ? 'Ready for download' : 'Processing...' }}
                    </div>
                  </div>
                  <div class="flex items-center">
                    <Button label="Download Results" icon="pi pi-download"
                      :disabled="batchStatus.status !== 'completed'" :loading="isDownloading"
                      @click="downloadResults(provider === 'openai' ? batchStatus.output_file_id : batchId)" />
                    <Button label="View Results" icon="pi pi-eye" class="ml-2"
                      :disabled="batchStatus.status !== 'completed'" :loading="isViewingResults"
                      @click="viewBatchResults(provider === 'openai' ? batchStatus.output_file_id : batchId)" />
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Message when no batch is selected or there's an error -->
        <div v-if="!batchStatus && !batchError" class="flex justify-center items-center h-64">
          <div class="text-center text-gray-500">
            <i class="pi pi-search text-4xl mb-2"></i>
            <div>Select a batch from the list or enter a batch ID to view details</div>
          </div>
        </div>

        <div v-if="batchError" class="mb-6">
          <Message severity="error">
            <template #summary>Error</template>
            <template #detail>{{ batchError }}</template>
          </Message>
        </div>
      </div>
    </div>

    <!-- Using the new ResultViewer component -->
    <ResultViewer v-model:visible="resultsDialog" :provider="provider" :batchId="batchId"
      :fileId="provider === 'openai' ? batchStatus?.output_file_id : batchId" @close="resultsDialog = false" />

    <Dialog v-model:visible="cancelDialog" header="Cancel Batch Job" modal :style="{ width: '450px' }">
      <div class="flex flex-column gap-3">
        <div>
          <p>Are you sure you want to cancel this batch job?</p>
          <p class="text-red-500 text-sm">This action cannot be undone.</p>
        </div>
      </div>
      <template #footer>
        <Button label="No" icon="pi pi-times" outlined @click="cancelDialog = false" />
        <Button label="Yes, Cancel Batch" icon="pi pi-check" severity="danger" @click="cancelBatch"
          :loading="isCancelling" />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Divider from 'primevue/divider';
import ProgressBar from 'primevue/progressbar';
import Message from 'primevue/message';
import Toast from 'primevue/toast';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import { useToast } from 'primevue/usetoast';
import Popover from 'primevue/popover';
import ApiServiceFactory from '../services/ApiServiceFactory';
import ResultViewer from '../components/ResultViewer.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const batchId = ref('');
const isLoading = ref(false);
const isListLoading = ref(false);
const isDownloading = ref(false);
const isCancelling = ref(false);
const batchStatus = ref(null);
const batchError = ref(null);
const recentBatchJobs = ref([]);
const cancelDialog = ref(false);
const statusPopover = ref(null);
const resultsDialog = ref(false);
const isViewingResults = ref(false);

const getTotalTasks = () => {
  const counts = batchStatus.value?.request_counts || {};
  return (counts.succeeded || 0) +
    (counts.errored || 0) +
    (counts.processing || 0) +
    (counts.canceled || 0);
};

const getCompletionPercentage = () => {
  const total = getTotalTasks();
  if (total === 0) return 0;

  const completed = (batchStatus.value?.request_counts?.succeeded || 0) +
    (batchStatus.value?.request_counts?.errored || 0) +
    (batchStatus.value?.request_counts?.canceled || 0);

  return Math.round((completed / total) * 100);
};

// Provider handling
const selectedProvider = ref(route.query.provider || localStorage.getItem('selected_provider') || 'openai');
const providerOptions = ref([
  { name: 'OpenAI', value: 'openai' },
  { name: 'Anthropic', value: 'anthropic' }
]);

const provider = computed(() => selectedProvider.value);

const providerName = computed(() => {
  return provider.value === 'openai' ? 'OpenAI' : 'Anthropic';
});

const apiService = computed(() => {
  return ApiServiceFactory.getService(provider.value);
});

// Watch for provider changes to update the batch list
watch(selectedProvider, (newProvider) => {
  loadRecentBatchJobs();
  updateUrlWithProvider();

  // Clear current batch if provider changes
  if (batchStatus.value) {
    batchStatus.value = null;
    batchError.value = null;
  }
});

onMounted(() => {
  // Load recent batch jobs based on provider
  loadRecentBatchJobs();

  // Check if batch ID is provided in query params
  const idFromRoute = route.query.id;
  if (idFromRoute) {
    batchId.value = idFromRoute;
    checkBatchStatus();
  }
});

function updateUrlWithProvider() {
  const query = { ...route.query, provider: selectedProvider.value };
  if (!batchId.value) {
    delete query.id;
  }
  router.replace({ path: '/check', query });
}

function onProviderChange() {
  localStorage.setItem('selected_provider', selectedProvider.value);
  updateUrlWithProvider();
}

function loadRecentBatchJobs() {
  recentBatchJobs.value = apiService.value.getSavedBatchJobs();
}

function selectBatch(id) {
  batchId.value = id;
  checkBatchStatus();
}

async function checkBatchStatus() {
  if (!batchId.value) return;

  isLoading.value = true;
  batchError.value = null;

  try {
    // Use ApiService to get batch status
    const data = await apiService.value.getBatchStatus(batchId.value);
    batchStatus.value = data;

    // Update batch status in storage via ApiService
    apiService.value.saveBatchInfo({
      id: data.id,
      status: data.status,
      date: data.created_at,
      input_file_id: data.input_file_id,
      output_file_id: data.output_file_id,
      completion_window: data.completion_window,
      provider: selectedProvider.value
    });

    // Update URL with batch ID and provider for sharing
    router.replace({ path: '/check', query: { id: batchId.value, provider: selectedProvider.value } });

  } catch (error) {
    console.error('Error checking batch status:', error);
    batchError.value = error.message;
  } finally {
    isLoading.value = false;
  }
}

async function fetchAllBatches() {
  isListLoading.value = true;
  batchError.value = null;

  try {
    // Use ApiService to list batches
    const batches = await apiService.value.listBatches(10);

    // Update local storage with fetched batches
    apiService.value.updateBatchesInStorage(batches);

    // Reload the list
    loadRecentBatchJobs();

    // Show success message
    toast.add({
      severity: 'success',
      summary: 'Batches Retrieved',
      detail: `Retrieved ${batches.length} batch jobs`,
      life: 3000
    });

  } catch (error) {
    console.error('Error fetching batches:', error);
    batchError.value = error.message;

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message,
      life: 5000
    });
  } finally {
    isListLoading.value = false;
  }
}

async function downloadResults(fileId) {
  if (!fileId) return;

  isDownloading.value = true;

  try {
    // Use ApiService to download file content
    const content = await apiService.value.downloadFileContent(fileId);

    // Create a blob and download it
    const blob = new Blob([content], { type: 'application/x-jsonlines' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_${batchId.value}_output.jsonl`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();

    toast.add({
      severity: 'success',
      summary: 'Download Complete',
      detail: 'Results downloaded successfully',
      life: 3000
    });

  } catch (error) {
    console.error('Error downloading results:', error);

    toast.add({
      severity: 'error',
      summary: 'Download Failed',
      detail: error.message,
      life: 5000
    });
  } finally {
    isDownloading.value = false;
  }
}

// Simplified function to open the result viewer
function viewBatchResults(fileId) {
  if (!fileId) return;

  isViewingResults.value = true;
  resultsDialog.value = true;

  // The ResultViewer component will handle loading the data
  setTimeout(() => {
    isViewingResults.value = false;
  }, 500);
}

function confirmCancelBatch() {
  cancelDialog.value = true;
}

async function cancelBatch() {
  if (!batchId.value) return;

  isCancelling.value = true;

  try {
    // Use ApiService to cancel batch
    await apiService.value.cancelBatchJob(batchId.value);

    // Close the dialog
    cancelDialog.value = false;

    // Show success message
    toast.add({
      severity: 'success',
      summary: 'Batch Cancelled',
      detail: 'The batch job has been cancelled successfully',
      life: 3000
    });

    // Refresh status
    checkBatchStatus();

  } catch (error) {
    console.error('Error cancelling batch:', error);

    toast.add({
      severity: 'error',
      summary: 'Cancellation Failed',
      detail: error.message,
      life: 5000
    });
  } finally {
    isCancelling.value = false;
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';

  if (typeof dateString === 'number') {
    dateString = dateString * 1000; // Convert to milliseconds
  }

  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString;
  }
}

function formatStatus(status) {
  if (!status) return 'Unknown';

  const statusMap = {
    completed: 'Completed',
    in_progress: 'In Progress',
    pending: 'Pending',
    failed: 'Failed',
    cancelled: 'Cancelled'
  };

  return statusMap[status] || status;
}

function calculateProgress(status) {
  if (!status) return 0;

  if (status.status === 'completed') return 100;
  if (status.status === 'failed') return 100;
  if (status.status === 'cancelled') return 100;

  if (status.processed_count && status.total_count) {
    return (status.processed_count / status.total_count) * 100;
  }

  // Default progress for in_progress status when counts aren't available
  return status.status === 'in_progress' ? 50 : 10;
}
</script>