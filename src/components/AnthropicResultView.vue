<!-- AnthropicResultView.vue -->
<template>
  <div>
    <!-- Success View -->
    <div v-if="resultType === 'succeeded'"
      class="bg-white rounded border border-gray-200 p-4 overflow-auto max-h-[32rem] relative">
      <!-- Header with action buttons -->
      <div class="flex justify-end gap-2 sticky top-2 right-2 z-10">
        <Button icon="pi pi-copy" class="!p-2" rounded text @click="copyContent" tooltip="Copy Content"
          :tooltipOptions="{ position: 'left' }" />
      </div>

      <div class="markdown-container markdown-light" v-html="parsedContent"></div>
    </div>

    <!-- Error View -->
    <div v-else-if="resultType === 'errored'"
      class="bg-white rounded border border-red-200 p-4 whitespace-pre-wrap overflow-auto max-h-[32rem]">
      <div class="text-red-600 font-medium mb-2">Error</div>
      <div class="bg-red-50 p-3 rounded">
        <div v-if="errorMessage" class="mb-1">{{ errorMessage }}</div>
        <div v-if="errorType" class="text-sm text-red-700">Type: {{ errorType }}</div>
        <div v-if="errorDetails" class="text-sm mt-2 p-2 bg-red-100 rounded">
          <div class="font-medium">Details:</div>
          <div>{{ errorDetails }}</div>
        </div>
      </div>
    </div>

    <!-- Unknown Type View -->
    <div v-else class="bg-white rounded border border-gray-200 p-4 whitespace-pre-wrap overflow-auto max-h-[32rem]">
      <div class="text-gray-600 font-medium">Unknown result type</div>
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

marked.setOptions({
  breaks: true,
  gfm: true
});

const resultType = computed(() => {
  if (!props.result?.result?.type) return 'unknown';
  return props.result.result.type;
});

const extractedContent = computed(() => {
  if (!props.result?.result?.message?.content) return '';

  const content = props.result.result.message.content;

  if (Array.isArray(content)) {
    return content
      .filter(item => item.type === 'text' && item.text)
      .map(item => item.text)
      .join('\n\n');
  }

  if (typeof content === 'string') {
    return content;
  }

  return '';
});

const parsedContent = computed(() => {
  let parsed = marked.parse(extractedContent.value);

  parsed = parsed.replace(
    /<pre><code( class="language-[^"]*")?>([^<]+)<\/code><\/pre>/g,
    (match, langClass, codeContent) => {
      const lines = codeContent.trim().split('\n');
      const lineNumbers = lines.map((_, idx) => `<span class="line-number">${idx + 1}</span>`).join('');

      return `
      <div class="code-block-wrapper relative group">
        <div class="code-header flex justify-between items-center px-3 py-1 text-xs bg-gray-800 text-gray-200">
          <span class="code-language">${langClass ? langClass.replace('class="language-', '').replace('"', '') : 'text'}</span>
          <button class="code-copy-btn opacity-0 group-hover:opacity-100 transition-opacity text-gray-200">
            <i class="pi pi-copy"></i> Copy
          </button>
        </div>
        <div class="code-container flex">
          <div class="line-numbers bg-gray-900 text-gray-400 text-right pr-2 select-none">${lineNumbers}</div>
          <pre class="flex-1 overflow-x-auto bg-gray-900"><code${langClass}>${codeContent}</code></pre>
        </div>
      </div>
    `;
    }
  );

  parsed = parsed.replace(
    /<table>/g,
    '<div class="table-container overflow-x-auto"><table class="w-full border-collapse">'
  );
  parsed = parsed.replace(
    /<\/table>/g,
    '</table></div>'
  );

  parsed = parsed.replace(
    /<h([1-6])>([^<]+)<\/h\1>/g,
    (match, level, text) => {
      const id = text.toLowerCase().replace(/[^\w]+/g, '-');
      return `<h${level} id="${id}" class="group relative">
                ${text}
                <a href="#${id}" class="anchor-link ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <i class="pi pi-link"></i>
                </a>
              </h${level}>`;
    }
  );

  return parsed;
});

const errorMessage = computed(() => {
  return props.result?.result?.error?.error?.message || '';
});

const errorType = computed(() => {
  return props.result?.result?.error?.error?.type || '';
});

const errorDetails = computed(() => {
  return props.result?.result?.error?.error?.details || '';
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