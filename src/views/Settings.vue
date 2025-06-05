<!-- Settings.vue -->
<template>
  <div class="max-w-3xl mx-auto">
    <Card class="shadow-lg">
      <template #title>
        <div class="flex items-center">
          <i class="pi pi-key mr-2"></i>
          <span>API Settings</span>
        </div>
      </template>

      <template #content>
        <TabView>
          <!-- OpenAI Settings -->
          <TabPanel header="OpenAI">
            <div class="mb-6">
              <h2 class="text-xl font-semibold mb-4">OpenAI API Key</h2>
              <p class="mb-4 text-sm">Your API key is securely stored in your browser's local storage.</p>

              <div class="p-field mb-4">
                <label for="openaiApiKey" class="block mb-2 font-medium">API Key</label>
                <InputText id="openaiApiKey" v-model="openaiApiKey" class="w-full p-inputtext-sm"
                  :type="showOpenaiKey ? 'text' : 'password'" placeholder="Enter your OpenAI API key" />
              </div>

              <div class="flex gap-4">
                <Button label="Toggle Visibility" icon="pi pi-eye" @click="showOpenaiKey = !showOpenaiKey" outlined
                  class="text-sm" />
                <Button label="Save API Key" icon="pi pi-save" @click="saveOpenaiKey" :disabled="!openaiApiKey"
                  class="text-sm" />
              </div>
            </div>

            <!-- Models Cache Management -->
            <div class="mt-8">
              <h2 class="text-xl font-semibold mb-4">Models Cache</h2>
              <p class="mb-4 text-sm">Manage the cached list of available OpenAI text generation models.</p>

              <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">Cache Status</div>
                    <div class="text-sm text-gray-600">
                      {{ openAICacheStatus }}
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <Button label="Refresh Cache" icon="pi pi-refresh" @click="refreshOpenAIModelsCache" :loading="isRefreshingOpenAI"
                      class="text-sm" />
                    <Button label="Clear Cache" icon="pi pi-trash" severity="danger" @click="clearOpenAIModelsCache"
                      class="text-sm" />
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- Anthropic Settings -->
          <TabPanel header="Anthropic">
            <div class="mb-6">
              <h2 class="text-xl font-semibold mb-4">Anthropic API Key</h2>
              <p class="mb-4 text-sm">Your API key is securely stored in your browser's local storage.</p>

              <div class="p-field mb-4">
                <label for="anthropicApiKey" class="block mb-2 font-medium">API Key</label>
                <InputText id="anthropicApiKey" v-model="anthropicApiKey" class="w-full p-inputtext-sm"
                  :type="showAnthropicKey ? 'text' : 'password'" placeholder="Enter your Anthropic API key" />
              </div>

              <div class="flex gap-4">
                <Button label="Toggle Visibility" icon="pi pi-eye" @click="showAnthropicKey = !showAnthropicKey"
                  outlined class="text-sm" />
                <Button label="Save API Key" icon="pi pi-save" @click="saveAnthropicKey" :disabled="!anthropicApiKey"
                  class="text-sm" />
              </div>
            </div>

            <!-- Models Cache Management -->
            <div class="mt-8">
              <h2 class="text-xl font-semibold mb-4">Models Cache</h2>
              <p class="mb-4 text-sm">Manage the cached list of available Anthropic models.</p>

              <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">Cache Status</div>
                    <div class="text-sm text-gray-600">
                      {{ cacheStatus }}
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <Button label="Refresh Cache" icon="pi pi-refresh" @click="refreshModelsCache" :loading="isRefreshing"
                      class="text-sm" />
                    <Button label="Clear Cache" icon="pi pi-trash" severity="danger" @click="clearModelsCache"
                      class="text-sm" />
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabView>
      </template>
    </Card>

    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Toast from 'primevue/toast';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import { useToast } from 'primevue/usetoast';
import AnthropicModelsService from '../services/AnthropicModelsService';
import OpenAIModelsService from '../services/OpenAIModelsService';

const toast = useToast();

const openaiApiKey = ref('');
const anthropicApiKey = ref('');
const showOpenaiKey = ref(false);
const showAnthropicKey = ref(false);
const isRefreshing = ref(false);
const isRefreshingOpenAI = ref(false);
const cacheStatus = ref('No cache available');
const openAICacheStatus = ref('No cache available');

onMounted(async () => {
  const savedOpenaiKey = localStorage.getItem('openai_api_key');
  if (savedOpenaiKey) {
    openaiApiKey.value = savedOpenaiKey;
  }

  const savedAnthropicKey = localStorage.getItem('anthropic_api_key');
  if (savedAnthropicKey) {
    anthropicApiKey.value = savedAnthropicKey;
  }

  await updateCacheStatus();
  await updateOpenAICacheStatus();
});

async function updateCacheStatus() {
  try {
    const cached = localStorage.getItem('anthropic_models_cache');
    if (cached) {
      const { timestamp } = JSON.parse(cached);
      const date = new Date(timestamp);
      cacheStatus.value = `Last updated: ${date.toLocaleString()}`;
    } else {
      cacheStatus.value = 'No cache available';
    }
  } catch (e) {
    console.error('Error checking cache status:', e);
    cacheStatus.value = 'Error checking cache status';
  }
}

async function updateOpenAICacheStatus() {
  try {
    const cached = localStorage.getItem('openai_models_cache');
    if (cached) {
      const { timestamp } = JSON.parse(cached);
      const date = new Date(timestamp);
      openAICacheStatus.value = `Last updated: ${date.toLocaleString()}`;
    } else {
      openAICacheStatus.value = 'No cache available';
    }
  } catch (e) {
    console.error('Error checking OpenAI cache status:', e);
    openAICacheStatus.value = 'Error checking cache status';
  }
}

function saveOpenaiKey() {
  localStorage.setItem('openai_api_key', openaiApiKey.value);
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'OpenAI API key saved successfully!',
    life: 3000
  });
}

function saveAnthropicKey() {
  localStorage.setItem('anthropic_api_key', anthropicApiKey.value);
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Anthropic API key saved successfully!',
    life: 3000
  });
}

async function refreshModelsCache() {
  if (!anthropicApiKey.value) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Please save your Anthropic API key first',
      life: 3000
    });
    return;
  }

  isRefreshing.value = true;
  try {
    await AnthropicModelsService.refreshModels();
    await updateCacheStatus();
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Models cache refreshed successfully!',
      life: 3000
    });
  } catch (error) {
    console.error('Error refreshing models cache:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'Failed to refresh models cache',
      life: 3000
    });
  } finally {
    isRefreshing.value = false;
  }
}

function clearModelsCache() {
  AnthropicModelsService.clearCache();
  updateCacheStatus();
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Models cache cleared successfully!',
    life: 3000
  });
}

async function refreshOpenAIModelsCache() {
  if (!openaiApiKey.value) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Please save your OpenAI API key first',
      life: 3000
    });
    return;
  }

  isRefreshingOpenAI.value = true;
  try {
    await OpenAIModelsService.refreshModels();
    await updateOpenAICacheStatus();
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'OpenAI models cache refreshed successfully!',
      life: 3000
    });
  } catch (error) {
    console.error('Error refreshing OpenAI models cache:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'Failed to refresh OpenAI models cache',
      life: 3000
    });
  } finally {
    isRefreshingOpenAI.value = false;
  }
}

function clearOpenAIModelsCache() {
  OpenAIModelsService.clearCache();
  updateOpenAICacheStatus();
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'OpenAI models cache cleared successfully!',
    life: 3000
  });
}
</script>