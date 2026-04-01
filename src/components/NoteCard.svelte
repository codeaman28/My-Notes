<script lang="ts">
  import Modal from "./Modal.svelte";
  import { updateNote } from "$lib/api/notes";
  import { notes, deletedNote } from "../stores/notesStore";
  import type { Note } from "$lib/types/note";

  const { note, searchQuery = "" } = $props<{ note: Note; searchQuery?: string }>();

  let isOpen = $state(false);
  let title = $state(note.title);
  let content = $state(note.content);
  let loading = $state(false);
  let deleteOpen = $state(false);

  const strips = ["#de5949", "#e8714a", "#c9413b", "#d96849", "#d94f62"];
  const strip = $derived(strips[note.id % strips.length]);

  const preview = $derived(
    note.content.length > 130
      ? note.content.slice(0, 130) + "…"
      : note.content,
  );

  const formattedDate = $derived(
    new Date(note.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  );

  const handleUpdate = async () => {
    if (!title || !content) {
      alert("Fields cannot be empty");
      return;
    }
    loading = true;
    try {
      const updated = await updateNote(note.id, { title, content });
      notes.update((n) => n.map((item) => (item.id === note.id ? updated : item)));
      isOpen = false;
    } catch (err) {
      console.error(err);
      alert("Failed to update");
    } finally {
      loading = false;
    }
  };

  const handleDelete = () => {
    deletedNote.set(note);
    notes.update((n) => n.filter((item) => item.id !== note.id));
    deleteOpen = false;
  };

  const togglePin = async (e: Event) => {
    e.stopPropagation();
    try {
      const updated = await updateNote(note.id, { isPinned: !note.isPinned });
      notes.update((n) => n.map((item) => (item.id === note.id ? updated : item)));
    } catch (err) {
      console.error(err);
      alert("Failed to pin note");
    }
  };

  function highlightText(text: string, query: string) {
    if (!text) return "";
    const escapedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (!query) return escapedText;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, "gi");

    return escapedText.replace(
      regex,
      `<mark class="bg-yellow-200 dark:bg-yellow-600/60 text-yellow-900 dark:text-yellow-100 rounded px-0.5 not-italic">$1</mark>`
    );
  }
</script>

<div
  class="group relative flex flex-col min-h-[170px] rounded-2xl bg-gradient-to-b from-[#fff8f7] to-white dark:from-gray-800 dark:to-gray-800/80 border border-[#f0a89e] dark:border-gray-700/80 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[#de594918] dark:hover:shadow-black/40 hover:-translate-y-1.5 transition-all duration-200"
>
  <div class="h-[6px] w-full flex-shrink-0 transition-all duration-300" style="background: linear-gradient(90deg, {strip}, {strip}cc);"></div>

  {#if note.isPinned}
    <span class="absolute top-3 left-3 inline-flex items-center gap-1 bg-[#de5949] dark:bg-[#ff7262] text-white text-[0.6rem] font-bold px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider leading-none">
      <svg class="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M16 11V5h1V3H7v2h1v6l-2 3v2h4v6h2v-6h4v-2l-2-3z"/></svg>
      Pinned
    </span>
  {/if}

  <div class="flex flex-col gap-2 px-4 pt-3.5 pb-3 flex-1">
    <div class="flex items-start justify-between w-full gap-2">
      <h2 class="text-sm font-bold text-gray-900 dark:text-gray-100 truncate leading-snug flex-1 mt-0.5">
        {@html highlightText(note.title, searchQuery)}
      </h2>
      <button
        class="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-[#de5949] dark:hover:text-[#ff7262] hover:bg-[#de594912] dark:hover:bg-[#ff726215] transition-all duration-150"
        onclick={togglePin}
        title={note.isPinned ? "Unpin note" : "Pin note"}
      >
        {#if note.isPinned}
          <svg class="w-3.5 h-3.5 fill-[#de5949] dark:fill-[#ff7262]" viewBox="0 0 24 24"><path d="M16 11V5h1V3H7v2h1v6l-2 3v2h4v6h2v-6h4v-2l-2-3z"/></svg>
        {:else}
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M16 11V5h1V3H7v2h1v6l-2 3v2h4v6h2v-6h4v-2l-2-3zm-2-6v6.61l2 3V15H8v-1.39l2-3V5h4z"/></svg>
        {/if}
      </button>
    </div>

    <p class="text-[0.775rem] text-gray-500 dark:text-gray-400 leading-relaxed flex-1 whitespace-pre-line break-words line-clamp-4">
      {@html highlightText(preview, searchQuery)}
    </p>
  </div>

  <div class="flex items-center justify-between px-4 py-2 border-t border-[#de594912] dark:border-gray-700/60 bg-white/60 dark:bg-gray-900/30 backdrop-blur-sm">
    <span class="flex items-center gap-1 text-[0.63rem] text-gray-400 dark:text-gray-500 font-medium">
      <svg class="w-3 h-3 fill-current opacity-60" viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5C3.9 4 3 4.9 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/></svg>
      {formattedDate}
    </span>

    <div class="flex gap-1.5">
      <button
        title="Edit note"
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.7rem] font-semibold text-[#de5949] dark:text-[#ff7262] border border-[#de5949]/30 dark:border-[#ff7262]/30 bg-[#de594908] dark:bg-[#ff726210] hover:bg-[#de5949] dark:hover:bg-[#ff7262] hover:text-white dark:hover:text-gray-900 hover:border-transparent transition-all duration-150"
        onclick={() => { title = note.title; content = note.content; isOpen = true; }}
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        Edit
      </button>
      <button
        title="Delete note"
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.7rem] font-semibold text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 hover:text-red-500 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-150"
        onclick={() => (deleteOpen = true)}
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        Delete
      </button>
    </div>
  </div>
</div>

<Modal {isOpen} onClose={() => (isOpen = false)}>
  <div class="flex items-center gap-2 mb-5">
    <div class="w-1 h-6 rounded-full" style="background:{strip};"></div>
    <h2 class="text-[1.05rem] font-bold text-gray-900 dark:text-gray-100">Edit Note</h2>
  </div>
  <label for="edit-title" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Title</label>
  <input
    id="edit-title"
    class="w-full bg-white dark:bg-gray-800 border-[1.5px] border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 font-[inherit] mb-4 focus:outline-none focus:border-[#de5949] dark:focus:border-[#ff7262] focus:ring-2 focus:ring-[#de594915]"
    bind:value={title}
    placeholder="Note title…"
  />
  <label for="edit-content" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Content</label>
  <textarea
    id="edit-content"
    class="w-full bg-white dark:bg-gray-800 border-[1.5px] border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 font-[inherit] mb-5 min-h-[120px] resize-y focus:outline-none focus:border-[#de5949] dark:focus:border-[#ff7262] focus:ring-2 focus:ring-[#de594915]"
    bind:value={content}
    placeholder="Write something…"
  ></textarea>
  <button
    class="w-full py-2.5 bg-[#de5949] dark:bg-[#ff7262] text-white dark:text-gray-900 font-bold rounded-xl text-sm hover:bg-[#c9413b] dark:hover:bg-[#ff5a47] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-[#de594930]"
    onclick={handleUpdate}
    disabled={loading}
  >
    {loading ? "Saving…" : "Save Changes"}
  </button>
</Modal>

<Modal isOpen={deleteOpen} onClose={() => (deleteOpen = false)}>
  <div class="flex flex-col items-center text-center mb-5">
    <div class="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-3">
      <svg class="w-6 h-6 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
      </svg>
    </div>
    <h2 class="text-[1.05rem] font-bold text-gray-900 dark:text-gray-100 mb-1">Delete this note?</h2>
    <p class="text-sm text-gray-500 dark:text-gray-400">You can undo within <strong class="text-gray-700 dark:text-gray-300">10 seconds</strong>.</p>
  </div>
  <div class="flex gap-3">
    <button
      class="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold rounded-xl text-sm border-[1.5px] border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      onclick={() => (deleteOpen = false)}
    >Cancel</button>
    <button
      class="flex-1 py-2.5 bg-red-500 dark:bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-600 dark:hover:bg-red-700 transition-colors shadow-md shadow-red-500/20"
      onclick={handleDelete}
    >
      Yes, Delete
    </button>
  </div>
</Modal>
