<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { fetchNotes, deleteNote, createNote } from "$lib/api/notes";
  import { notes, loading, deletedNote, pendingNotes } from "../stores/notesStore";
  import NoteCard from "../components/NoteCard.svelte";
  import NoteForm from "../components/NoteForm.svelte";
  import Toast from "../components/Toast.svelte";

  let sortBy = $state("newest");
  let isDark = $state(false);
  let isFormExpanded = $state(false);

  // _pendingLoaded guards against the $effect flushing localStorage
  // with [] before onMount has had a chance to restore saved pending notes.
  let _pendingLoaded = $state(false);
  $effect(() => {
    if (!_pendingLoaded) return;
    localStorage.setItem("pendingNotes", JSON.stringify($pendingNotes));
  });

  async function syncPendingNotes() {
    const pending = get(pendingNotes);
    if (pending.length === 0) return;

    for (const note of pending) {
      try {
        const res = await createNote({
          title: note.title,
          content: note.content,
          createdAt: note.createdAt,
        });

        notes.update((n) => {
          const idx = n.findIndex((e) => e.id === note.tempId || (e.title === note.title && e.createdAt === note.createdAt));
          if (idx >= 0) {
            const updated = [...n];
            updated[idx] = res;
            return updated;
          }
          return [res, ...n];
        });

        pendingNotes.update((n) => n.filter((p) => p.tempId !== note.tempId && p.title !== note.title));
      } catch (err) {
        console.error("Sync failed for note:", note.title, err);
      }
    }

    try {
      const fresh = await fetchNotes();
      const stillPending = get(pendingNotes);
      const tempNotes = stillPending.map((p) => ({
        id: p.tempId || `temp_${Date.now()}`,
        title: p.title,
        content: p.content,
        createdAt: p.createdAt,
      }));
      const freshFiltered = fresh.filter(f => !stillPending.some(p => p.title === f.title && p.createdAt === f.createdAt));
      notes.set([...tempNotes, ...freshFiltered]);
    } catch (err) {
      console.error("Refresh after sync failed:", err);
    }
  }

  onMount(() => {
    const savedPending = localStorage.getItem("pendingNotes");
    if (savedPending) {
      try {
        pendingNotes.set(JSON.parse(savedPending));
      } catch {
        localStorage.removeItem("pendingNotes");
      }
    }
    _pendingLoaded = true;

    const saved = localStorage.getItem("theme");
    isDark =
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    applyTheme(isDark);

    const handleKeydown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.altKey && e.key === "n" && !isTyping) {
        e.preventDefault();
        isFormExpanded = true;
      }
      if (e.altKey && e.key === "d" && !isTyping) {
        e.preventDefault();
        toggleTheme();
      }
      if (e.key === "Escape") {
        isFormExpanded = false;
      }
    };
    window.addEventListener("keydown", handleKeydown);

    const handleOnline = () => syncPendingNotes();
    window.addEventListener("online", handleOnline);

    (async () => {
      try {
        loading.set(true);
        const data = await fetchNotes();

        const pending = get(pendingNotes);
        const tempNotes = pending.map((p) => ({
          id: p.tempId || `temp_${Date.now()}`,
          title: p.title,
          content: p.content,
          createdAt: p.createdAt,
        }));
        const filteredData = data.filter(
          (d) => !pending.some((p) => p.title === d.title && p.createdAt === d.createdAt),
        );
        notes.set([...tempNotes, ...filteredData]);
      } catch (err) {
        console.error(err);
      } finally {
        loading.set(false);
      }

      if (navigator.onLine) {
        setTimeout(syncPendingNotes, 1000);
      }
    })();

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("online", handleOnline);
    };
  });

  function applyTheme(dark: boolean) {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }

  function toggleTheme() {
    isDark = !isDark;
    applyTheme(isDark);
  }

  let showToast = $state(false);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  let search = $state("");
  let debouncedSearch = $state("");
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  const handleSearch = (value: string) => {
    search = value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debouncedSearch = value;
      currentPage = 1;
    }, 400);
  };

  let currentPage = $state(1);
  const itemsPerPage = 20;

  const filteredNotes = $derived(
    $notes
      .filter((note) =>
        note.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        note.content.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (sortBy === "title") return a.title.localeCompare(b.title);
        if (sortBy === "id") return Number(a.id) - Number(b.id);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
  );

  const paginatedNotes = $derived(
    filteredNotes.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    ),
  );

  const totalPages = $derived(Math.ceil(filteredNotes.length / itemsPerPage));

  $effect(() => {
    if ($deletedNote) {
      showToast = true;
      timeoutId = setTimeout(async () => {
        try {
          await deleteNote($deletedNote.id);
        } catch (e) {
          console.error(e);
        }
        deletedNote.set(null);
        showToast = false;
      }, 10000);
    }
  });

  const handleUndo = () => {
    if ($deletedNote) {
      notes.update((n) => [$deletedNote, ...n]);
      deletedNote.set(null);
      clearTimeout(timeoutId);
      showToast = false;
    }
  };
</script>

<div class="min-h-screen bg-[#fdfcfc] dark:bg-gray-950 transition-colors duration-300">
  <div class="max-w-[1440px] mx-auto px-7 pb-20">
    <header
      class="sticky top-0 z-50 flex items-center justify-between flex-wrap gap-4 py-4 mb-6 border-b border-[#f0a89e] dark:border-gray-800 bg-[#fdfcfc]/80 dark:bg-gray-950/80 backdrop-blur-md"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#de5949] to-[#e8714a] flex items-center justify-center text-xl shadow-lg shadow-[#de594940] flex-shrink-0"
        >
          📝
        </div>
        <div>
          <h1 class="text-xl font-extrabold text-[#de5949] dark:text-[#ff7262] tracking-tight leading-tight">
            My Notes
          </h1>
          <p class="text-[0.7rem] text-gray-400 dark:text-gray-500 mt-0.5">
            Capture your thoughts, stay organised.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2.5">
        <div class="relative flex items-center">
          <svg class="absolute left-3 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            class="bg-white dark:bg-gray-800 border border-[#f0a89e] dark:border-gray-700 rounded-full py-2 pl-8 pr-4 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-[inherit] w-56 focus:outline-none focus:border-[#de5949] dark:focus:border-[#ff7262] focus:ring-2 focus:ring-[#de594918] focus:w-72 shadow-sm transition-all duration-200"
            placeholder="Search notes…"
            value={search}
            oninput={(e) => handleSearch((e.target as HTMLInputElement).value)}
          />
        </div>

        <button
          onclick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          class="w-9 h-9 rounded-xl border border-[#f0a89e] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#de5949] dark:text-[#ff7262] flex items-center justify-center hover:bg-[#de5949] dark:hover:bg-[#ff7262] hover:text-white dark:hover:text-gray-900 hover:border-transparent shadow-sm transition-all duration-200 flex-shrink-0"
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>
    </header>

    {#if !$loading}
      <div class="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-[#f0a89e] dark:border-gray-700 text-[#de5949] dark:text-[#ff7262] text-[0.7rem] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wide"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-[#de5949] dark:bg-[#ff7262] inline-block"></span>
            {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}
          </span>

          {#if $pendingNotes.length > 0}
            <span
              title="These notes will sync automatically when you're back online"
              class="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-[0.7rem] font-bold px-3 py-1 rounded-full uppercase tracking-wide animate-pulse"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400"></span>
              {$pendingNotes.length} pending sync
            </span>
          {/if}
        </div>

        <div class="flex items-center gap-2">
          <label for="sort-select" class="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">Sort</label>
          <select
            id="sort-select"
            class="border border-[#f0a89e] dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#de5949] dark:focus:border-[#ff7262] focus:ring-2 focus:ring-[#de594915] shadow-sm transition-all cursor-pointer"
            bind:value={sortBy}
          >
            <option value="newest">Newest first</option>
            <option value="title">Title (A–Z)</option>
            <option value="id">Oldest first</option>
          </select>
        </div>
      </div>
    {/if}

    <NoteForm
      isExpanded={isFormExpanded}
      setExpanded={(v) => (isFormExpanded = v)}
    />

    {#if $loading}
      <div
        class="grid grid-cols-5 gap-4 mt-5 max-[1200px]:grid-cols-4 max-[900px]:grid-cols-3 max-[600px]:grid-cols-2 max-[420px]:grid-cols-1"
      >
        {#each Array(10) as _}
          <div class="rounded-2xl border border-[#f0a89e]/60 dark:border-gray-700 overflow-hidden animate-pulse bg-white dark:bg-gray-800">
            <div class="h-[6px] w-full bg-[#f5b3ab] dark:bg-gray-700"></div>
            <div class="p-4 flex flex-col gap-3">
              <div class="h-3.5 w-2/3 rounded-lg bg-[#f5dbd9] dark:bg-gray-700"></div>
              <div class="h-2.5 w-full rounded-lg bg-[#f5e9e8] dark:bg-gray-700/60"></div>
              <div class="h-2.5 w-4/5 rounded-lg bg-[#f5e9e8] dark:bg-gray-700/60"></div>
              <div class="h-2.5 w-1/2 rounded-lg bg-[#f5e9e8] dark:bg-gray-700/60"></div>
            </div>
            <div class="h-8 mx-4 mb-3 rounded-lg bg-[#f5eeee] dark:bg-gray-700/40"></div>
          </div>
        {/each}
      </div>
    {:else}
      {#if paginatedNotes.length === 0}
        <div class="flex flex-col items-center justify-center py-28 select-none">
          <div class="relative mb-6">
            <div class="absolute inset-0 rounded-full bg-[#de594912] dark:bg-[#ff726212] scale-150 blur-xl"></div>
            <div class="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#fff5f4] to-[#f5dbd9] dark:from-gray-800 dark:to-gray-750 border border-[#f0a89e] dark:border-gray-700 flex items-center justify-center text-4xl shadow-sm">
              🗒️
            </div>
          </div>
          <p class="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">
            {debouncedSearch ? 'No notes match your search' : 'No notes yet'}
          </p>
          <p class="text-sm text-gray-400 dark:text-gray-500">
            {debouncedSearch ? 'Try a different keyword.' : 'Create your first note above.'}
          </p>
        </div>
      {:else}
        <div
          class="grid grid-cols-5 gap-4 mt-5 max-[1200px]:grid-cols-4 max-[900px]:grid-cols-3 max-[600px]:grid-cols-2 max-[420px]:grid-cols-1"
        >
          {#each paginatedNotes as note}
            <NoteCard {note} searchQuery={debouncedSearch} />
          {/each}
        </div>

        <div class="flex justify-center items-center gap-6 mt-10">
          <button
            onclick={() => currentPage--}
            disabled={currentPage === 1}
            class="px-5 py-2 rounded-full border-[1.5px] border-[#de5949] dark:border-[#ff7262] bg-white dark:bg-gray-900 text-[#de5949] dark:text-[#ff7262] text-sm font-semibold cursor-pointer hover:bg-[#de5949] dark:hover:bg-[#ff7262] hover:text-white dark:hover:text-gray-900 hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            ← Prev
          </button>

          <span class="text-sm text-gray-500 dark:text-gray-400">
            Page <strong class="text-[#de5949] dark:text-[#ff7262]">{currentPage}</strong>
            of
            <strong class="text-[#de5949] dark:text-[#ff7262]">{totalPages || 1}</strong>
          </span>

          <button
            onclick={() => currentPage++}
            disabled={currentPage === totalPages || totalPages === 0}
            class="px-5 py-2 rounded-full border-[1.5px] border-[#de5949] dark:border-[#ff7262] bg-white dark:bg-gray-900 text-[#de5949] dark:text-[#ff7262] text-sm font-semibold cursor-pointer hover:bg-[#de5949] dark:hover:bg-[#ff7262] hover:text-white dark:hover:text-gray-900 hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            Next →
          </button>
        </div>
      {/if}
    {/if}

    <footer class="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Built by Aman •
        <a
          href="https://github.com/YOUR_USERNAME/YOUR_REPO"
          target="_blank"
          class="text-[#de5949] dark:text-[#ff7262] font-semibold hover:underline"
        >
          View on GitHub
        </a>
      </p>
    </footer>
  </div>
</div>

{#if showToast}
  <Toast message="Note deleted" onUndo={handleUndo} />
{/if}
