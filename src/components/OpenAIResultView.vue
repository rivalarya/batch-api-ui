<!-- OpenAIResultView.vue -->
<template>
  <div>
    <!-- Success View -->
    <div v-if="isSuccess"
      class="bg-white rounded border border-gray-200 p-4 markdown-content whitespace-pre-wrap overflow-auto max-h-96 relative">
      <!-- Copy button in top-right of success view -->
      <Button icon="pi pi-copy" class="!absolute top-2 right-2" rounded text @click="copyContent" tooltip="Copy Content"
        :tooltipOptions="{ position: 'right' }" />

      <div class="pt-4" v-html="parsedContent" style="line-height: 0.8rem;"></div>
    </div>

    <!-- Error View -->
    <div v-else-if="isError"
      class="bg-white rounded border border-red-200 p-4 markdown-content whitespace-pre-wrap overflow-auto max-h-96">
      <div class="text-red-600 font-medium mb-2">Error</div>
      <div class="bg-red-50 p-3 rounded">
        <div v-if="errorMessage" class="mb-1">{{ errorMessage }}</div>
        <div v-if="errorType" class="text-sm text-red-700">Type: {{ errorType }}</div>
      </div>
    </div>

    <!-- Unknown Type View -->
    <div v-else
      class="bg-white rounded border border-gray-200 p-4 markdown-content whitespace-pre-wrap overflow-auto max-h-96">
      <div class="text-gray-600 font-medium">Unknown result format</div>
      <pre class="mt-2 bg-gray-50 p-2 rounded text-sm">{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { marked } from 'marked';

const props = defineProps({
  result: {
    type: Object,
    required: true
  }
});

const toast = useToast();

const isSuccess = computed(() => {
  if (props.result?.response?.status_code === 200) {
    return true;
  }

  if (props.result?.status_code === 200) {
    return true;
  }

  return (props.result?.body?.choices?.[0]?.message?.content !== undefined) ||
    (props.result?.response?.body?.choices?.[0]?.message?.content !== undefined);
});

const isError = computed(() => {
  if (props.result?.error) {
    return true;
  }

  if (props.result?.response?.status_code && props.result.response.status_code !== 200) {
    return true;
  }

  if (props.result?.status_code && props.result.status_code !== 200) {
    return true;
  }

  return props.result?.body?.error || props.result?.response?.body?.error;
});

const extractedContent = computed(() => {
  if (props.result?.response?.body?.choices?.[0]?.message?.content) {
    return props.result.response.body.choices[0].message.content;
  }

  if (props.result?.body?.choices?.[0]?.message?.content) {
    return props.result.body.choices[0].message.content;
  }

  if (props.result?.response?.body?.choices?.[0]?.text) {
    return props.result.response.body.choices[0].text;
  }

  if (props.result?.body?.choices?.[0]?.text) {
    return props.result.body.choices[0].text;
  }

  if (props.result?.response?.body?.choices && typeof props.result.response.body.choices[0] === 'string') {
    return props.result.response.body.choices[0];
  }

  if (props.result?.body?.choices && typeof props.result.body.choices[0] === 'string') {
    return props.result.body.choices[0];
  }

  if (props.result?.response?.body?.content) {
    return props.result.response.body.content;
  }

  if (props.result?.body?.content) {
    return props.result.body.content;
  }

  if (props.result?.content) {
    return props.result.content;
  }

  if (props.result?.response?.content) {
    return props.result.response.content;
  }

  return '';
});

const parsedContent = computed(() => {
  let parsed = marked.parse(extractedContent.value);

  parsed = parsed.replace(
    /<pre><code( class="language-[^"]*")?>([^<]+)<\/code><\/pre>/g,
    '<div class="relative code-block-wrapper"><pre><code$1>$2</code></pre><button class="code-copy-btn"><i class="pi pi-copy"></i></button></div>'
  );

  return parsed;
});

const errorMessage = computed(() => {
  if (props.result?.error?.message) {
    return props.result.error.message;
  }

  if (props.result?.response?.body?.error?.message) {
    return props.result.response.body.error.message;
  }

  if (props.result?.body?.error?.message) {
    return props.result.body.error.message;
  }

  if (props.result?.error && typeof props.result.error === 'string') {
    return props.result.error;
  }

  if (props.result?.response?.error && typeof props.result.response.error === 'string') {
    return props.result.response.error;
  }

  return 'An error occurred';
});

const errorType = computed(() => {
  if (props.result?.error?.type) {
    return props.result.error.type;
  }

  if (props.result?.response?.body?.error?.type) {
    return props.result.response.body.error.type;
  }

  if (props.result?.body?.error?.type) {
    return props.result.body.error.type;
  }

  return '';
});

function copyContent() {
  if (!extractedContent.value) return;

  navigator.clipboard.writeText(extractedContent.value)
    .then(() => {
      toast.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'Content copied to clipboard',
        life: 3000
      });
    })
    .catch(err => {
      console.error('Failed to copy text: ', err);
      toast.add({
        severity: 'error',
        summary: 'Copy Failed',
        detail: 'Failed to copy to clipboard',
        life: 3000
      });
    });
}

onMounted(() => {
  setTimeout(() => {
    const copyButtons = document.querySelectorAll('.code-copy-btn');
    copyButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const codeBlock = e.target.closest('.code-block-wrapper').querySelector('code');
        const codeText = codeBlock.textContent;

        navigator.clipboard.writeText(codeText)
          .then(() => {
            toast.add({
              severity: 'success',
              summary: 'Copied',
              detail: 'Code copied to clipboard',
              life: 3000
            });
          })
          .catch(err => {
            console.error('Failed to copy code: ', err);
            toast.add({
              severity: 'error',
              summary: 'Copy Failed',
              detail: 'Failed to copy to clipboard',
              life: 3000
            });
          });
      });
    });
  }, 100);
});
</script>