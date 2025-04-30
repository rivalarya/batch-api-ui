<!-- ResultViewer.vue -->
<template>
  <div>
    <Dialog v-model:visible="resultsDialog" header="Batch Results" modal maximizable :style="{ width: '70vw' }"
      class="results-dialog">
      <div v-if="isLoadingResults" class="flex justify-center items-center p-6">
        <i class="pi pi-spin pi-spinner text-2xl"></i>
        <span class="ml-2">Loading results...</span>
      </div>

      <div v-else-if="resultError" class="p-4">
        <Message severity="error">
          <template #detail>{{ resultError }}</template>
        </Message>
      </div>

      <div v-else>
        <div class="flex justify-between items-center mb-3 p-2 bg-gray-50 rounded">
          <div>
            <span class="font-medium">Total Results: </span>
            <span>{{ resultData.length }}</span>
          </div>
          <div>
            <Button label="Previous" icon="pi pi-chevron-left" outlined :disabled="currentResultIndex === 0"
              @click="currentResultIndex--" />
            <span class="mx-3">{{ currentResultIndex + 1 }} of {{ resultData.length }}</span>
            <Button label="Next" icon="pi pi-chevron-right" iconPos="right" outlined
              :disabled="currentResultIndex >= resultData.length - 1" @click="currentResultIndex++" />
          </div>
        </div>

        <div v-if="resultData.length > 0" class="grid grid-cols-1 gap-3">
          <!-- Render the appropriate component based on provider -->
          <AnthropicResultView v-if="props.provider === 'anthropic'" :result="currentResult" />
          <OpenAIResultView v-else :result="currentResult" />

          <!-- Metadata toggle -->
          <div class="mt-1">
            <Button @click="showMetadata = !showMetadata" class="w-full text-left"
              :icon="showMetadata ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
              :label="showMetadata ? 'Hide Metadata' : 'Show Metadata'" text />
          </div>

          <!-- Metadata panel -->
          <div v-if="showMetadata" class="metadata-panel p-3 border rounded bg-gray-50">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div v-for="(value, key) in metadata" :key="key" class="p-2 bg-white rounded border border-gray-200">
                <div class="text-xs font-medium text-gray-500">{{ formatFieldName(key) }}</div>
                <div class="text-sm whitespace-pre-wrap">
                  {{ typeof value === 'object' ? JSON.stringify(value, null, 2) : value }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center p-4">
          <p>No results available</p>
        </div>
      </div>

      <template #footer>
        <Button label="Close" icon="pi pi-times" @click="closeDialog" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useToast } from 'primevue/usetoast';
import AnthropicResultView from './AnthropicResultView.vue';
import OpenAIResultView from './OpenAIResultView.vue';
import ApiServiceFactory from '../services/ApiServiceFactory';

const props = defineProps({
  provider: {
    type: String,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  },
  batchId: {
    type: String,
    default: ''
  },
  fileId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'update:visible']);

const toast = useToast();
const resultsDialog = ref(false);
const resultData = ref([]);
const currentResultIndex = ref(0);
const isLoadingResults = ref(false);
const resultError = ref(null);
const showMetadata = ref(false);
const resultsCache = ref({});

const apiService = computed(() => {
  return ApiServiceFactory.getService(props.provider);
});

watch(() => props.visible, (newValue) => {
  resultsDialog.value = newValue;
  if (newValue && (props.fileId || props.batchId)) {
    loadResults();
  }
});

watch(resultsDialog, (newValue) => {
  emit('update:visible', newValue);
});

const currentResult = computed(() => {
  if (resultData.value.length === 0) return null;
  return resultData.value[currentResultIndex.value];
});

const metadata = computed(() => {
  if (!currentResult.value) return {};

  const metadataFields = {};

  if (currentResult.value.custom_id) {
    metadataFields.custom_id = currentResult.value.custom_id;
  }

  if (props.provider === 'anthropic') {
    if (currentResult.value.result?.type) {
      metadataFields.result_type = currentResult.value.result.type;
    }

    if (currentResult.value.result?.message) {
      const message = currentResult.value.result.message;

      if (message.id) metadataFields.id = message.id;
      if (message.type) metadataFields.message_type = message.type;
      if (message.role) metadataFields.role = message.role;
      if (message.model) metadataFields.model = message.model;
      if (message.stop_reason) metadataFields.stop_reason = message.stop_reason;
      if (message.stop_sequence) metadataFields.stop_sequence = message.stop_sequence;
      if (message.usage) metadataFields.usage = message.usage;
    }

    if (currentResult.value.result?.error) {
      const error = currentResult.value.result.error;

      if (error.type) metadataFields.error_type = error.type;
      if (error.error) {
        if (error.error.type) metadataFields.error_code = error.error.type;
        if (error.error.message) metadataFields.error_message = error.error.message;
        if (error.error.details) metadataFields.error_details = error.error.details;
      }
    }
  } else {
    if (currentResult.value.response) {
      if (currentResult.value.response.status_code) {
        metadataFields.status_code = currentResult.value.response.status_code;
      }

      if (currentResult.value.response.request_id) {
        metadataFields.request_id = currentResult.value.response.request_id;
      }

      if (currentResult.value.response.body) {
        const body = currentResult.value.response.body;

        if (body.id) metadataFields.id = body.id;
        if (body.model) metadataFields.model = body.model;
        if (body.object) metadataFields.object = body.object;
        if (body.created) metadataFields.created = formatDate(body.created * 1000);
        if (body.usage) metadataFields.usage = body.usage;
        if (body.system_fingerprint) metadataFields.system_fingerprint = body.system_fingerprint;
        if (body.service_tier) metadataFields.service_tier = body.service_tier;
      }
    }

    if (currentResult.value.body) {
      const body = currentResult.value.body;

      if (body.id) metadataFields.id = body.id;
      if (body.model) metadataFields.model = body.model;
      if (body.object) metadataFields.object = body.object;
      if (body.created) metadataFields.created = formatDate(body.created * 1000);
      if (body.usage) metadataFields.usage = body.usage;
      if (body.system_fingerprint) metadataFields.system_fingerprint = body.system_fingerprint;
      if (body.service_tier) metadataFields.service_tier = body.service_tier;
    }

    if (currentResult.value.status_code) metadataFields.status_code = currentResult.value.status_code;
    if (currentResult.value.request_id) metadataFields.request_id = currentResult.value.request_id;
  }

  return metadataFields;
});

async function loadResults() {
  const id = props.fileId || props.batchId;
  if (!id) return;

  isLoadingResults.value = true;
  resultError.value = null;
  currentResultIndex.value = 0;

  try {
    if (resultsCache.value[id]) {
      resultData.value = resultsCache.value[id];
      console.log('Using cached results for:', id);
      return;
    }

    const content = await apiService.value.downloadFileContent(id);

    const lines = content.trim().split('\n');
    const parsedResults = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return { content: line };
      }
    });

    resultsCache.value[id] = parsedResults;
    resultData.value = parsedResults;

  } catch (error) {
    console.error('Error loading results:', error);
    resultError.value = error.message;
  } finally {
    isLoadingResults.value = false;
  }
}

function formatFieldName(key) {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString;
  }
}

function closeDialog() {
  resultsDialog.value = false;
  emit('close');
}
</script>