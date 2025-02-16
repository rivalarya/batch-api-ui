<!-- Home.vue -->
<template>
  <div class="max-w-4xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h1 class="text-3xl font-bold mb-4">LLM Batch API Interface</h1>
      <p class="mb-4">Easily create and manage batch processes with OpenAI and Anthropic APIs.</p>

      <!-- API Provider Selection -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Select API Provider</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card class="shadow-sm cursor-pointer" :class="{ 'border-2 border-blue-500': selectedProvider === 'openai' }"
            @click="selectProvider('openai')">
            <template #title>
              <div class="flex items-center">
                <i class="pi pi-bolt mr-2 text-green-600"></i>
                <span>OpenAI</span>
              </div>
            </template>
            <template #content>
              <p>Use OpenAI's batch API for processing multiple requests.</p>
            </template>
          </Card>

          <Card class="shadow-sm cursor-pointer" :class="{ 'border-2 border-blue-500': selectedProvider === 'anthropic' }"
            @click="selectProvider('anthropic')">
            <template #title>
              <div class="flex items-center">
                <i class="pi pi-bolt mr-2 text-purple-600"></i>
                <span>Anthropic</span>
              </div>
            </template>
            <template #content>
              <p>Use Anthropic's batch API for processing multiple requests.</p>
            </template>
          </Card>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Card class="shadow-sm">
          <template #title>Create New Batch</template>
          <template #content>
            <p>Create a new batch job with custom settings and inputs.</p>
          </template>
          <template #footer>
            <Button label="Create Batch" icon="pi pi-plus" @click="goToCreate" :disabled="!selectedProvider" />
          </template>
        </Card>

        <Card class="shadow-sm">
          <template #title>Check Batch Status</template>
          <template #content>
            <p>Check the status of your existing batch jobs.</p>
          </template>
          <template #footer>
            <Button label="Check Status" icon="pi pi-list" @click="goToCheck" :disabled="!selectedProvider" />
          </template>
        </Card>
      </div>

      <div class="mt-8">
        <Card class="shadow-sm">
          <template #title>API Settings</template>
          <template #content>
            <p>Manage your API keys and other settings.</p>
          </template>
          <template #footer>
            <Button label="Settings" icon="pi pi-cog" @click="router.push('/settings')" />
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';

const router = useRouter();
const selectedProvider = ref('');

onMounted(() => {
  // Check if provider was previously selected
  const savedProvider = localStorage.getItem('selected_provider');
  if (savedProvider) {
    selectedProvider.value = savedProvider;
  }
});

function selectProvider(provider) {
  selectedProvider.value = provider;
  localStorage.setItem('selected_provider', provider);

  router.push(`/?provider=${provider}`);
}

function goToCreate() {
  if (selectedProvider.value) {
    router.push(`/create?provider=${selectedProvider.value}`);
  }
}

function goToCheck() {
  if (selectedProvider.value) {
    router.push(`/check?provider=${selectedProvider.value}`);
  }
}
</script>