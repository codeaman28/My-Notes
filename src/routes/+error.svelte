<script lang="ts">
  let { error, status } = $props();
</script>

<main class="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center px-4">

  <h1 class="text-6xl font-bold text-[#de5949] dark:text-[#ff7262] mb-4">
    {status}
  </h1>

  <h2 class="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
    Page Not Found
  </h2>

  <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
    The page you are looking for doesn’t exist or has been moved.
  </p>

  <a
    href="/"
    class="px-6 py-2 rounded-lg bg-[#de5949] dark:bg-[#ff7262] text-white font-semibold hover:opacity-90 transition"
  >
    Go Back Home
  </a>

</main>