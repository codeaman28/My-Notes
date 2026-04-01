<script lang="ts">
  const { message, onUndo } = $props<{
    message: string;
    onUndo: () => void;
  }>();
</script>

<div class="fixed bottom-7 right-7 flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 border-l-[3px] border-l-[#de5949] dark:border-l-[#ff7262] text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/40 z-[9999] animate-[slideUp_0.28s_cubic-bezier(0.16,1,0.3,1)] min-w-[240px]">
  <!-- Icon -->
  <div class="w-8 h-8 rounded-lg bg-[#de594912] dark:bg-[#ff726215] flex items-center justify-center shrink-0">
    <svg class="w-4 h-4 text-[#de5949] dark:text-[#ff7262]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
    </svg>
  </div>

  <!-- Message -->
  <div class="flex-1 min-w-0">
    <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">{message}</p>
    <p class="text-[0.68rem] text-gray-400 dark:text-gray-500 mt-0.5">Undo available for 10s</p>
  </div>

  <!-- Undo button -->
  <button
    onclick={onUndo}
    class="shrink-0 bg-[#de5949] dark:bg-[#ff7262] text-white dark:text-gray-900 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#c9413b] dark:hover:bg-[#ff5a47] transition-colors font-[inherit]"
  >
    Undo
  </button>

  <!-- Progress bar -->
  <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[#de594920] dark:bg-[#ff726215] rounded-b-xl overflow-hidden">
    <div class="h-full bg-[#de5949] dark:bg-[#ff7262] rounded-full animate-[shrink_10s_linear_forwards]"></div>
  </div>
</div>

<style>
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes shrink {
    from { width: 100%; }
    to   { width: 0%; }
  }
</style>
