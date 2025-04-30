<!-- App.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <Menubar :model="items" class="border-none shadow-md mb-4">
      <template #start>
        <div class="flex items-center">
          <i class="pi pi-bolt text-xl mr-2"></i>
          <span class="font-bold text-xl">{{ providerName }} Batch API</span>
        </div>
      </template>
    </Menubar>
    
    <div class="container mx-auto p-4">
      <router-view></router-view>
    </div>
    
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Menubar from 'primevue/menubar';
import Toast from 'primevue/toast';

const router = useRouter();
const route = useRoute();

const selectedProvider = ref(localStorage.getItem('selected_provider') || '');

watch(() => route.query.provider, (newProvider) => {
  if (newProvider) {
    selectedProvider.value = newProvider;
    localStorage.setItem('selected_provider', newProvider);
  }
}, { immediate: true });

const providerName = computed(() => {
  switch (selectedProvider.value) {
    case 'openai':
      return 'OpenAI';
    case 'anthropic':
      return 'Anthropic';
    default:
      return 'LLM';
  }
});

const items = ref([
  {
    label: 'Home',
    icon: 'pi pi-home',
    command: () => router.push('/')
  },
  {
    label: 'Create Batch',
    icon: 'pi pi-plus',
    command: () => {
      if (selectedProvider.value) {
        router.push(`/create?provider=${selectedProvider.value}`);
      } else {
        router.push('/');
      }
    }
  },
  {
    label: 'Check Batch',
    icon: 'pi pi-list',
    command: () => {
      if (selectedProvider.value) {
        router.push(`/check?provider=${selectedProvider.value}`);
      } else {
        router.push('/');
      }
    }
  },
  {
    label: 'Settings',
    icon: 'pi pi-cog',
    command: () => router.push('/settings')
  }
]);
</script>