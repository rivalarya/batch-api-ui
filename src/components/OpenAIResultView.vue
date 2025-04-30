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

// Determine if the response is successful
const isSuccess = computed(() => {
  // Check for nested response structure (batch API format)
  if (props.result?.response?.status_code === 200) {
    return true;
  }

  // Check for direct API response format
  if (props.result?.status_code === 200) {
    return true;
  }

  // Check if response contains choices with message content
  return (props.result?.body?.choices?.[0]?.message?.content !== undefined) ||
    (props.result?.response?.body?.choices?.[0]?.message?.content !== undefined);
});

// Determine if it's an error
const isError = computed(() => {
  // Check for error in batch API response
  if (props.result?.error) {
    return true;
  }

  // Check for error status code in nested response
  if (props.result?.response?.status_code && props.result.response.status_code !== 200) {
    return true;
  }

  // Check for error status code in direct response
  if (props.result?.status_code && props.result.status_code !== 200) {
    return true;
  }

  // Check for error in body
  return props.result?.body?.error || props.result?.response?.body?.error;
});

// Extract content from OpenAI response
const extractedContent = computed(() => {
  // Try batch API nested format
  if (props.result?.response?.body?.choices?.[0]?.message?.content) {
    return props.result.response.body.choices[0].message.content;
  }

  // Try direct API format
  if (props.result?.body?.choices?.[0]?.message?.content) {
    return props.result.body.choices[0].message.content;
  }

  // Try completion response (nested)
  if (props.result?.response?.body?.choices?.[0]?.text) {
    return props.result.response.body.choices[0].text;
  }

  // Try completion response (direct)
  if (props.result?.body?.choices?.[0]?.text) {
    return props.result.body.choices[0].text;
  }

  // For legacy completions or other formats (nested)
  if (props.result?.response?.body?.choices && typeof props.result.response.body.choices[0] === 'string') {
    return props.result.response.body.choices[0];
  }

  // For legacy completions or other formats (direct)
  if (props.result?.body?.choices && typeof props.result.body.choices[0] === 'string') {
    return props.result.body.choices[0];
  }

  // If content is directly on the body (nested)
  if (props.result?.response?.body?.content) {
    return props.result.response.body.content;
  }

  // If content is directly on the body (direct)
  if (props.result?.body?.content) {
    return props.result.body.content;
  }

  // If the result has direct content
  if (props.result?.content) {
    return props.result.content;
  }

  // If response has direct content
  if (props.result?.response?.content) {
    return props.result.response.content;
  }

  return '';
});

const parsedContent = computed(() => {
  // Parse the markdown content
  let parsed = marked.parse(extractedContent.value);
  
  // Add copy buttons to code blocks
  parsed = parsed.replace(
    /<pre><code( class="language-[^"]*")?>([^<]+)<\/code><\/pre>/g,
    '<div class="relative code-block-wrapper"><pre><code$1>$2</code></pre><button class="code-copy-btn"><i class="pi pi-copy"></i></button></div>'
  );
  
  return parsed;
});

// Extract error information
const errorMessage = computed(() => {
  // Check for error in nested structure
  if (props.result?.error?.message) {
    return props.result.error.message;
  }

  // Check for error in response body
  if (props.result?.response?.body?.error?.message) {
    return props.result.response.body.error.message;
  }

  // Check for error in direct body
  if (props.result?.body?.error?.message) {
    return props.result.body.error.message;
  }

  // Check for string error
  if (props.result?.error && typeof props.result.error === 'string') {
    return props.result.error;
  }

  // Check for string error in response
  if (props.result?.response?.error && typeof props.result.response.error === 'string') {
    return props.result.response.error;
  }

  return 'An error occurred';
});

const errorType = computed(() => {
  // Check for error type in nested structure
  if (props.result?.error?.type) {
    return props.result.error.type;
  }

  // Check for error type in response body
  if (props.result?.response?.body?.error?.type) {
    return props.result.response.body.error.type;
  }

  // Check for error type in direct body
  if (props.result?.body?.error?.type) {
    return props.result.body.error.type;
  }

  return '';
});

// Copy content function
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