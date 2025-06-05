<!-- JsonGenerator.vue -->
<template>
  <div class="max-w-7xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Request List Section (Left Side) -->
      <div class="md:col-span-1">
        <Card class="shadow-lg mb-6 h-full">
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <i class="pi pi-list mr-2"></i>
                <span>{{ providerName }} Requests</span>
              </div>
              <!-- Provider Selector -->
              <Select v-model="selectedProvider" :options="providerOptions" optionLabel="name" optionValue="value"
                class="w-auto text-sm" @change="onProviderChange" />
            </div>
          </template>
          <template #content>
            <div class="mb-4">
              <Button label="Add New Request" icon="pi pi-plus" class="w-full" @click="addNewRequest" />
            </div>

            <div v-if="requests.length > 0" class="mt-4">
              <div class="h-80 overflow-y-auto pr-2">
                <div class="grid grid-cols-1 gap-2">
                  <div v-for="(req, index) in requests" :key="index"
                    class="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                    :class="{ 'bg-blue-50': selectedRequestIndex === index }" @click="selectRequest(index)">
                    <div class="overflow-hidden">
                      <span class="font-medium text-sm">{{ req.custom_id || `Request ${index + 1}` }}</span>
                      <div class="text-xs text-gray-600 truncate">
                        {{ getRequestPreview(req) }}
                      </div>
                    </div>
                    <div class="flex">
                      <Button icon="pi pi-trash" text rounded severity="danger"
                        @click.stop="confirmDeleteRequest(index)" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="mt-4 text-center p-4 bg-gray-50 rounded">
              <p class="text-gray-600">No requests yet. Click "Add New Request" to begin.</p>
            </div>
          </template>
        </Card>
      </div>

      <!-- Form Section (Right Side) -->
      <div class="md:col-span-2">
        <!-- Form Card -->
        <Card v-if="selectedRequestIndex !== null" class="shadow-lg mb-6">
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <i class="pi pi-pencil mr-2"></i>
                <span>Edit Request</span>
              </div>
            </div>
          </template>
          <template #content>
            <div class="mb-4">
              <label for="custom_id" class="block mb-2 font-medium">Custom ID</label>
              <InputText id="custom_id" v-model="currentRequest.custom_id" class="w-full"
                placeholder="Enter a unique identifier for this request" />
            </div>

            <!-- OpenAI Form -->
            <div v-if="selectedProvider === 'openai'" class="mb-4">
              <div class="mb-4">
                <label for="model" class="block mb-2 font-medium">Model</label>
                <Select id="model" v-model="currentRequest.body.model" :options="openAIModels" class="w-full"
                  placeholder="Select a model" filter optionLabel="name" optionValue="value" :filterFields="['name']" />
              </div>

              <div class="mb-4">
                <label class="block mb-2 font-medium">Messages</label>
                <div v-for="(msg, msgIndex) in currentRequest.body.messages" :key="msgIndex"
                  class="mb-3 p-3 bg-gray-50 rounded relative">
                  <div class="absolute right-2 top-2">
                    <Button icon="pi pi-trash" text rounded severity="danger" @click="removeMessage(msgIndex)" />
                  </div>
                  <div class="mb-2">
                    <label :for="`role-${msgIndex}`" class="block mb-1 text-sm font-medium">Role</label>
                    <Select :id="`role-${msgIndex}`" v-model="msg.role" :options="messageRoles" class="w-full"
                      placeholder="Select a role" />
                  </div>
                  <div>
                    <label :for="`content-${msgIndex}`" class="block mb-1 text-sm font-medium">Content</label>
                    <Textarea :id="`content-${msgIndex}`" v-model="msg.content" rows="3" class="w-full"
                      placeholder="Enter message content" />
                  </div>
                </div>
                <Button label="Add Message" icon="pi pi-plus" outlined class="w-full mt-2" @click="addMessage" />
              </div>

              <div class="mb-4">
                <label for="max_tokens" class="block mb-2 font-medium">Max Tokens</label>
                <InputNumber id="max_tokens" v-model="currentRequest.body.max_tokens" class="w-full"
                  placeholder="Enter maximum tokens" />
              </div>

              <div class="mb-4">
                <label for="temperature" class="block mb-2 font-medium">Temperature</label>
                <InputNumber id="temperature" v-model="currentRequest.body.temperature" class="w-full"
                  placeholder="Enter temperature" :minFractionDigits="1" :maxFractionDigits="1" :step="0.1" />
              </div>
            </div>

            <!-- Anthropic Form -->
            <div v-else-if="selectedProvider === 'anthropic'" class="mb-4">
              <div class="mb-4">
                <label for="model" class="block mb-2 font-medium">Model</label>
                <Select id="model" v-model="currentRequest.params.model" :options="anthropicModels" class="w-full"
                  placeholder="Select a model" filter optionLabel="name" optionValue="value" :filterFields="['name']" />
              </div>

              <div class="mb-4">
                <label class="block mb-2 font-medium">Messages</label>
                <div v-for="(msg, msgIndex) in currentRequest.params.messages" :key="msgIndex"
                  class="mb-3 p-3 bg-gray-50 rounded relative">
                  <div class="absolute right-2 top-2">
                    <Button icon="pi pi-trash" text rounded severity="danger"
                      @click="removeAnthropicMessage(msgIndex)" />
                  </div>
                  <div class="mb-2">
                    <label :for="`role-${msgIndex}`" class="block mb-1 text-sm font-medium">Role</label>
                    <Select :id="`role-${msgIndex}`" v-model="msg.role" :options="anthropicMessageRoles"
                      class="w-full" placeholder="Select a role" />
                  </div>
                  <div>
                    <label :for="`content-${msgIndex}`" class="block mb-1 text-sm font-medium">Content</label>
                    <Textarea :id="`content-${msgIndex}`" v-model="msg.content" rows="3" class="w-full"
                      placeholder="Enter message content" />
                  </div>
                </div>
                <Button label="Add Message" icon="pi pi-plus" outlined class="w-full mt-2"
                  @click="addAnthropicMessage" />
              </div>

              <div class="mb-4">
                <label for="max_tokens" class="block mb-2 font-medium">Max Tokens</label>
                <InputNumber id="max_tokens" v-model="currentRequest.params.max_tokens" class="w-full"
                  placeholder="Enter maximum tokens" />
              </div>

              <div class="mb-4">
                <label for="temperature" class="block mb-2 font-medium">Temperature</label>
                <InputNumber id="temperature" v-model="currentRequest.params.temperature" class="w-full"
                  placeholder="Enter temperature" :minFractionDigits="1" :maxFractionDigits="1" :step="0.1" />
              </div>
            </div>

            <div class="flex justify-end">
              <Button label="Save Request" icon="pi pi-save" @click="saveRequest" />
            </div>
          </template>
        </Card>

        <!-- JSON Output Card -->
        <Card class="shadow-lg mb-6">
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <i class="pi pi-code mr-2"></i>
                <span>JSONL Output</span>
              </div>
              <Button icon="pi pi-copy" label="Copy" @click="copyJsonl" />
            </div>
          </template>
          <template #content>
            <div class="code-block-wrapper">
              <pre v-html="highlightedJsonl"></pre>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Confirm Delete Dialog -->
    <Dialog v-model:visible="deleteDialog" header="Confirm Delete" modal :style="{ width: '30vw' }">
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
        <span>Are you sure you want to delete this request?</span>
      </div>
      <template #footer>
        <Button label="No" icon="pi pi-times" outlined @click="deleteDialog = false" />
        <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteRequest" />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { marked } from 'marked';
import AnthropicModelsApiService from '../services/AnthropicModelsService';
import OpenAIModelsService from '../services/OpenAIModelsService';

const toast = useToast();
const route = useRoute();
const router = useRouter();

const requests = ref([]);
const selectedRequestIndex = ref(null);
const currentRequest = ref({});
const deleteDialog = ref(false);
const deleteIndex = ref(null);

const selectedProvider = ref(route.query.provider || localStorage.getItem('selected_provider') || 'openai');
const providerOptions = ref([
  { name: 'OpenAI', value: 'openai' },
  { name: 'Anthropic', value: 'anthropic' }
]);

const openAIModels = ref([
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
].map(model => ({ name: model, value: model })));

const anthropicModels = ref([
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20240620',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-haiku-20240307',
  'claude-3-opus-20240229'
].map(model => ({ name: model, value: model })));

const messageRoles = ['system', 'user', 'assistant'];
const anthropicMessageRoles = ['user', 'assistant'];

const providerName = computed(() => {
  return selectedProvider.value === 'openai' ? 'OpenAI' : 'Anthropic';
});

const jsonlOutput = computed(() => {
  if (requests.value.length === 0) {
    return '';
  }

  return requests.value.map(req => JSON.stringify(req)).join('\n');
});

const highlightedJsonl = computed(() => {
  if (!jsonlOutput.value) return '';

  const lines = jsonlOutput.value.split('\n');
  const highlightedLines = lines.map(line => hljs(line, 'json'));
  return highlightedLines.join('\n');
});

function hljs(code, language) {
  // Simple syntax highlighting function
  if (!code) return '';

  const highlighted = code
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });

  return highlighted;
}

watch(selectedProvider, async (newProvider) => {
  localStorage.setItem('selected_provider', newProvider);
  updateUrlWithProvider();
  loadRequestsFromLocalStorage();
  selectedRequestIndex.value = null;

  if (newProvider === 'anthropic') {
    try {
      const models = await AnthropicModelsApiService.getModels();
      anthropicModels.value = models.map(model => ({ name: model, value: model }));
    } catch (error) {
      console.error('Error loading Anthropic models:', error);
      // Keep using the default models if there's an error
    }
  } else if (newProvider === 'openai') {
    try {
      const models = await OpenAIModelsService.getModels();
      openAIModels.value = models.map(model => ({ name: model, value: model }));
    } catch (error) {
      console.error('Error loading OpenAI models:', error);
      // Keep using the default models if there's an error
    }
  }
});

onMounted(async () => {
  loadRequestsFromLocalStorage();
  if (selectedProvider.value === 'anthropic') {
    try {
      const models = await AnthropicModelsApiService.getModels();
      anthropicModels.value = models.map(model => ({ name: model, value: model }));
    } catch (error) {
      console.error('Error loading Anthropic models:', error);
      // Keep using the default models if there's an error
    }
  } else if (selectedProvider.value === 'openai') {
    try {
      const models = await OpenAIModelsService.getModels();
      openAIModels.value = models.map(model => ({ name: model, value: model }));
    } catch (error) {
      console.error('Error loading OpenAI models:', error);
      // Keep using the default models if there's an error
    }
  }
});

function updateUrlWithProvider() {
  const query = { ...route.query, provider: selectedProvider.value };
  router.replace({ path: '/jsonl-generator', query });
}

function onProviderChange() {
  updateUrlWithProvider();
}

function loadRequestsFromLocalStorage() {
  try {
    const savedRequests = localStorage.getItem(`${selectedProvider.value}_requests`);
    if (savedRequests) {
      requests.value = JSON.parse(savedRequests);
    } else {
      requests.value = [];
    }
  } catch (e) {
    console.error('Error loading requests:', e);
    requests.value = [];
  }
}

function saveRequestsToLocalStorage() {
  try {
    localStorage.setItem(`${selectedProvider.value}_requests`, JSON.stringify(requests.value));
  } catch (e) {
    console.error('Error saving requests:', e);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to save requests to local storage',
      life: 3000
    });
  }
}

function createDefaultOpenAIRequest() {
  return {
    custom_id: `request-${Date.now()}`,
    method: "POST",
    url: "/v1/chat/completions",
    body: {
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: "Hello!"
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    }
  };
}

function createDefaultAnthropicRequest() {
  return {
    custom_id: `request-${Date.now()}`,
    params: {
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1024,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: "Hello!"
        }
      ]
    }
  };
}

function addNewRequest() {
  if (selectedProvider.value === 'openai') {
    const newRequest = createDefaultOpenAIRequest();
    requests.value.push(newRequest);
  } else {
    const newRequest = createDefaultAnthropicRequest();
    requests.value.push(newRequest);
  }

  saveRequestsToLocalStorage();
  selectedRequestIndex.value = requests.value.length - 1;
  currentRequest.value = JSON.parse(JSON.stringify(requests.value[selectedRequestIndex.value]));
}

function selectRequest(index) {
  selectedRequestIndex.value = index;
  currentRequest.value = JSON.parse(JSON.stringify(requests.value[index]));
}

function getRequestPreview(request) {
  if (selectedProvider.value === 'openai') {
    const messages = request.body?.messages || [];
    const userMsg = messages.find(m => m.role === 'user');
    return userMsg ? (userMsg.content.length > 30 ? userMsg.content.substring(0, 30) + '...' : userMsg.content) : 'No user message';
  } else {
    const messages = request.params?.messages || [];
    const userMsg = messages.find(m => m.role === 'user');
    return userMsg ? (userMsg.content.length > 30 ? userMsg.content.substring(0, 30) + '...' : userMsg.content) : 'No user message';
  }
}

function confirmDeleteRequest(index) {
  deleteIndex.value = index;
  deleteDialog.value = true;
}

function deleteRequest() {
  if (deleteIndex.value !== null) {
    requests.value.splice(deleteIndex.value, 1);
    saveRequestsToLocalStorage();

    if (selectedRequestIndex.value === deleteIndex.value) {
      selectedRequestIndex.value = null;
      currentRequest.value = {};
    } else if (selectedRequestIndex.value > deleteIndex.value) {
      selectedRequestIndex.value--;
    }

    deleteDialog.value = false;
    deleteIndex.value = null;
  }
}

function addMessage() {
  currentRequest.value.body.messages.push({
    role: 'user',
    content: ''
  });
}

function addAnthropicMessage() {
  currentRequest.value.params.messages.push({
    role: 'user',
    content: ''
  });
}

function removeMessage(index) {
  currentRequest.value.body.messages.splice(index, 1);
}

function removeAnthropicMessage(index) {
  currentRequest.value.params.messages.splice(index, 1);
}

function saveRequest() {
  if (selectedRequestIndex.value !== null) {
    requests.value[selectedRequestIndex.value] = JSON.parse(JSON.stringify(currentRequest.value));
    saveRequestsToLocalStorage();

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Request saved successfully',
      life: 2000
    });
  }
}

function copyJsonl() {
  if (!jsonlOutput.value) {
    toast.add({
      severity: 'info',
      summary: 'Info',
      detail: 'No content to copy',
      life: 2000
    });
    return;
  }

  // Try using the Clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(jsonlOutput.value)
      .then(() => {
        toast.add({
          severity: 'success',
          summary: 'Copied',
          detail: 'JSONL content copied to clipboard',
          life: 2000
        });
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        fallbackCopyToClipboard();
      });
  } else {
    // Fallback for non-secure contexts or when clipboard API is not available
    fallbackCopyToClipboard();
  }
}

function fallbackCopyToClipboard() {
  // Create a temporary textarea element
  const textArea = document.createElement('textarea');
  textArea.value = jsonlOutput.value;
  
  // Make the textarea out of viewport
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  
  // Select and copy the text
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      toast.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'JSONL content copied to clipboard',
        life: 2000
      });
    } else {
      throw new Error('Copy command failed');
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
    toast.add({
      severity: 'error',
      summary: 'Copy Failed',
      detail: 'Failed to copy to clipboard',
      life: 3000
    });
  }
  
  // Clean up
  document.body.removeChild(textArea);
}
</script>

<style scoped>
.code-block-wrapper {
  position: relative;
  background-color: #1e1e1e;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 1em;
  line-height: 1.5;
  overflow-x: auto;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  color: #f8f8f2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.code-block-wrapper pre {
  margin: 0;
  white-space: pre-wrap;
}

.string {
  color: #a8ff60;
}

.number {
  color: #ff9e57;
}

.boolean {
  color: #99c794;
}

.null {
  color: #f99157;
}

.key {
  color: #c594c5;
}
</style>