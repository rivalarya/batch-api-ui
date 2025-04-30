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

const toast = useToast();

const openaiApiKey = ref('');
const anthropicApiKey = ref('');
const showOpenaiKey = ref(false);
const showAnthropicKey = ref(false);

onMounted(() => {
  const savedOpenaiKey = localStorage.getItem('openai_api_key');
  if (savedOpenaiKey) {
    openaiApiKey.value = savedOpenaiKey;
  }

  const savedAnthropicKey = localStorage.getItem('anthropic_api_key');
  if (savedAnthropicKey) {
    anthropicApiKey.value = savedAnthropicKey;
  }
});

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
</script>