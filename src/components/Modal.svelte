<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';

  const { isOpen, onClose, children } = $props<{
    isOpen: boolean;
    onClose: () => void;
    children?: Snippet;
  }>();

  onMount(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-sm z-[100] animate-[fadeIn_0.2s_ease]"
    onclick={onClose}
    role="presentation"
  ></div>

  <!-- Panel -->
  <div
    class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(480px,calc(100vw-2rem))] bg-white dark:bg-gray-900 border-[1.5px] border-[#f5b3ab] dark:border-gray-700 border-t-4 border-t-[#de5949] dark:border-t-[#ff7262] rounded-2xl p-7 shadow-2xl z-[101] animate-[slideIn_0.22s_cubic-bezier(0.16,1,0.3,1)]"
    role="dialog"
    aria-modal="true"
  >
    <!-- Close button -->
    <button
      onclick={onClose}
      class="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-xs flex items-center justify-center hover:bg-[#fff5f4] dark:hover:bg-red-900/20 hover:border-[#f5b3ab] dark:hover:border-red-700 hover:text-[#de5949] dark:hover:text-red-400 transition-all"
      title="Close"
    >✕</button>

    {@render children?.()}
  </div>
{/if}

<style>
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translate(-50%, -47%) scale(0.97); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
</style>