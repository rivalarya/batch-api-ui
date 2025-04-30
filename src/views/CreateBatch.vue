<!-- CreateBatch.vue -->
<template>
  <div class="max-w-4xl mx-auto">
    <Card class="shadow-lg">
      <template #title>
        <div class="flex items-center">
          <i class="pi pi-plus-circle mr-2"></i>
          <span>Create {{ providerName }} Batch Job</span>
        </div>
      </template>

      <template #content>
        <Stepper :modelValue="activeStep" class="w-full">
          <StepList>
            <Step v-for="(step, i) in steps" :key="i" :value="i + 1" :id="`step-${i + 1}`">{{ step.label }}</Step>
          </StepList>

          <StepPanels>
            <!-- Step 1: API Key Verification -->
            <StepPanel v-slot="{ activateCallback }" :value="1">
              <div class="mb-4">
                <h2 class="text-xl font-semibold mb-2">API Key Verification</h2>
                <p>We need your {{ providerName }} API key to create and check batch jobs.</p>
              </div>

              <div class="p-field mb-4">
                <label for="stepApiKey" class="block mb-2 font-medium">{{ providerName }} API Key</label>
                <InputText id="stepApiKey" v-model="apiKey" class="w-full" :type="showApiKey ? 'text' : 'password'"
                  :placeholder="`Enter your ${providerName} API key`" />
              </div>

              <div class="flex items-center gap-2 mb-4">
                <Checkbox v-model="saveKeyFlag" :binary="true" inputId="saveKey" />
                <label for="saveKey" class="text-sm">Save API key for future use</label>
              </div>

              <div class="flex gap-2 justify-between">
                <Button label="Toggle Visibility" icon="pi pi-eye" @click="showApiKey = !showApiKey" outlined />
                <Button label="Verify & Continue" icon="pi pi-arrow-right" iconPos="right"
                  @click="verifyAndContinue(activateCallback)" :disabled="!apiKey" />
              </div>
            </StepPanel>

            <!-- Step 2: Batch Configuration -->
            <StepPanel v-slot="{ activateCallback }" :value="2">
              <div class="mb-4">
                <h2 class="text-xl font-semibold mb-2">Batch Configuration</h2>
                <p>Configure your batch job settings.</p>
              </div>

              <div class="p-field mb-4">
                <label for="jsonlInput" class="block mb-2 font-medium">JSONL Input</label>
                <Textarea id="jsonlInput" v-model="jsonlInput" rows="8" class="w-full"
                  placeholder="Enter your JSONL data here. Each line should be a valid JSON object." />
              </div>

              <Panel class="mb-4" header="JSONL Format Example" toggleable :collapsed="true">
                <pre v-if="provider === 'openai'" class="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
{"custom_id": "request-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "gpt-4.1-nano", "messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "Describe the development of computer technology in 400 words. Version 1."}], "max_tokens": 500}}
{"custom_id": "request-2", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "gpt-4.1-nano", "messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "Describe the development of computer technology in 400 words. Version 2."}], "max_tokens": 500}}
                </pre>
                <pre v-else class="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
{"custom_id": "request-1", "params": {"model": "claude-3-7-sonnet-20250219", "max_tokens": 1024, "messages": [{"role": "user", "content": "Describe the development of computer technology in 400 words. Version 1."}]}}
{"custom_id": "request-2", "params": {"model": "claude-3-7-sonnet-20250219", "max_tokens": 1024, "messages": [{"role": "user", "content": "Describe the development of computer technology in 400 words. Version 2."}]}}
                </pre>
              </Panel>

              <div class="flex justify-between">
                <Button label="Back" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback(1)" />
                <Button label="Next" icon="pi pi-arrow-right" iconPos="right"
                  @click="validateAndGoToReview(activateCallback)" :disabled="!isConfigValid" />
              </div>
            </StepPanel>

            <!-- Step 3: Review & Submit -->
            <StepPanel v-slot="{ activateCallback }" :value="3">
              <div class="mb-4">
                <h2 class="text-xl font-semibold mb-2">Review & Submit</h2>
                <p>Review your batch job settings before submitting.</p>
              </div>

              <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 class="font-semibold mb-2">Batch Settings</h3>
                    <div class="text-sm">
                      <div class="flex justify-between py-1 border-b border-gray-200">
                        <span class="font-medium">Provider:</span>
                        <span>{{ providerName }}</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-gray-200">
                        <span class="font-medium">Input Format:</span>
                        <span>JSONL</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-gray-200">
                        <span class="font-medium">Input Size:</span>
                        <span>{{ countJsonlEntries() }} entries</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-gray-200">
                        <span class="font-medium">Completion Window:</span>
                        <span>24 hours</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 class="font-semibold mb-2">API Endpoint</h3>
                    <div class="text-sm">
                      <pre class="bg-gray-100 p-2 rounded">{{ apiEndpoint }}</pre>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex justify-between">
                <Button label="Back" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback(2)" />
                <Button label="Submit Batch Job" icon="pi pi-send" iconPos="right"
                  @click="submitBatchJob(activateCallback)" :loading="isSubmitting" />
              </div>
            </StepPanel>

            <!-- Step 4: Confirmation -->
            <StepPanel v-slot="{ activateCallback }" :value="4">
              <div class="text-center">
                <div class="flex flex-col items-center">
                  <i class="pi pi-check-circle text-green-500 text-5xl mb-4"></i>
                  <h2 class="text-2xl font-semibold mb-2">Batch Job Submitted!</h2>
                  <p class="mb-4">Your batch job has been successfully submitted.</p>

                  <div class="bg-gray-50 p-4 rounded-lg mb-4 w-full max-w-lg">
                    <div class="flex justify-between py-1 border-b border-gray-200">
                      <span class="font-medium">Batch ID:</span>
                      <span class="font-mono">{{ batchJobId }}</span>
                    </div>
                    <div v-if="provider === 'openai'" class="flex justify-between py-1 border-b border-gray-200">
                      <span class="font-medium">File ID:</span>
                      <span class="font-mono">{{ inputFileId }}</span>
                    </div>
                    <div class="flex justify-between py-1 border-b border-gray-200">
                      <span class="font-medium">Submitted:</span>
                      <span>{{ new Date().toLocaleString() }}</span>
                    </div>
                    <div class="flex justify-between py-1 border-b border-gray-200">
                      <span class="font-medium">Completion Window:</span>
                      <span>24 hours</span>
                    </div>
                  </div>

                  <div class="flex gap-4">
                    <Button label="Check Status" icon="pi pi-search" @click="goToCheckBatch" />
                    <Button label="Create Another Batch" icon="pi pi-plus" @click="resetForm" outlined />
                  </div>
                </div>
              </div>
            </StepPanel>
          </StepPanels>
        </Stepper>
      </template>
    </Card>

    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Card from 'primevue/card';
import Stepper from 'primevue/stepper';
import StepList from 'primevue/steplist';
import StepPanels from 'primevue/steppanels';
import Step from 'primevue/step';
import StepPanel from 'primevue/steppanel';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import Panel from 'primevue/panel';
import ApiServiceFactory from '../services/ApiServiceFactory';

const router = useRouter();
const route = useRoute();
const toast = useToast();

const provider = ref(route.query.provider || 'openai');
const apiService = computed(() => ApiServiceFactory.getService(provider.value));

const providerName = computed(() => {
  return provider.value === 'openai' ? 'OpenAI' : 'Anthropic';
});

const apiEndpoint = computed(() => {
  return provider.value === 'openai'
    ? 'https://api.openai.com/v1/batches'
    : 'https://api.anthropic.com/v1/messages/batches';
});

const activeStep = ref(1);
const steps = ref([
  { label: 'API Key' },
  { label: 'Configuration' },
  { label: 'Review' },
  { label: 'Confirmation' }
]);

const apiKey = ref('');
const showApiKey = ref(false);
const saveKeyFlag = ref(true);
const apiKeyVerified = ref(false);

const jsonlInput = ref('');
const isSubmitting = ref(false);
const batchJobId = ref('');
const inputFileId = ref('');
const completionWindow = ref('24h');

const isConfigValid = computed(() => {
  if (!jsonlInput.value.trim()) return false;

  const lines = jsonlInput.value.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') continue;

    try {
      JSON.parse(trimmed);
      return true;
    } catch (e) {
      // Pass
    }
  }

  try {
    const jsonObj = JSON.parse(jsonlInput.value);
    return true;
  } catch (e) {
    return false;
  }
});

onMounted(() => {
  apiKey.value = apiService.value.getApiKey() || '';

  setTimeout(() => {
    const firstStepElement = document.querySelector('#step-1>button');
    if (firstStepElement) {
      firstStepElement.click();
    }
  }, 100);
});

function verifyAndContinue(activateCallback) {
  if (apiKey.value.trim() === '') {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Please enter a valid API key',
      life: 3000
    });
    return;
  }

  if (!apiService.value.isValidApiKeyFormat(apiKey.value)) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: `API key format may be invalid. ${providerName.value} API keys typically start with ${provider.value === 'openai' ? '"sk-"' : '"sk-ant-"'
        }`,
      life: 3000
    });
  }

  if (saveKeyFlag.value) {
    apiService.value.saveApiKey(apiKey.value);
  }

  apiKeyVerified.value = true;
  activateCallback(2);
}

function countJsonlEntries() {
  if (!jsonlInput.value.trim()) return 0;

  const lines = jsonlInput.value.split('\n');
  let count = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') continue;

    try {
      JSON.parse(trimmed);
      count++;
    } catch (e) {

    }
  }

  if (count === 0) {
    try {
      JSON.parse(jsonlInput.value);
      return 1;
    } catch (e) {
      return 0;
    }
  }

  return count;
}

function validateAndGoToReview(activateCallback) {
  if (!isConfigValid.value) {
    toast.add({
      severity: 'error',
      summary: 'Invalid Configuration',
      detail: 'Please provide valid JSONL data',
      life: 3000
    });
    return;
  }

  activateCallback(3);
}

function createJsonlFile() {
  let jsonlContent = jsonlInput.value;

  try {
    const jsonObj = JSON.parse(jsonlInput.value);
    jsonlContent = JSON.stringify(jsonObj);
  } catch (e) {
    // pass
  }

  const jsonlBlob = new Blob([jsonlContent], { type: 'application/x-jsonlines' });
  return new File([jsonlBlob], 'batchinput.jsonl', { type: 'application/x-jsonlines' });
}

async function submitBatchJob(activateCallback) {
  isSubmitting.value = true;

  try {
    const jsonlFile = createJsonlFile();

    if (provider.value === 'openai') {
      const fileId = await apiService.value.uploadFile(jsonlFile);
      inputFileId.value = fileId;

      const batchId = await apiService.value.createBatchJob(fileId, '/v1/chat/completions', '24h');
      batchJobId.value = batchId;

      apiService.value.saveBatchInfo({
        id: batchJobId.value,
        status: 'pending',
        input_file_id: inputFileId.value,
        date: new Date().toISOString(),
        completion_window: '24h',
        provider: provider.value
      });
    } else {
      const batchId = await apiService.value.createBatchJob(jsonlFile);
      batchJobId.value = batchId;

      apiService.value.saveBatchInfo({
        id: batchJobId.value,
        status: 'pending',
        date: new Date().toISOString(),
        completion_window: '24h',
        provider: provider.value
      });
    }

    activateCallback(4);
  } catch (error) {
    console.error('Error submitting batch job:', error);
    toast.add({
      severity: 'error',
      summary: 'Submission Error',
      detail: error.message,
      life: 5000
    });
  } finally {
    isSubmitting.value = false;
  }
}

function goToCheckBatch() {
  router.push({ path: '/check', query: { id: batchJobId.value, provider: provider.value } });
}

function resetForm() {
  jsonlInput.value = '';
  batchJobId.value = '';
  inputFileId.value = '';
  setTimeout(() => {
    const firstStepElement = document.querySelector('#step-1>button');
    if (firstStepElement) {
      firstStepElement.click();
    }
  }, 100);
}
</script>