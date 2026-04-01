<script lang="ts">
  import { createNote } from "$lib/api/notes";
  import { notes, pendingNotes } from "../stores/notesStore";

  let _internalExpanded = $state(false);

  const props = $props<{
    isExpanded?: boolean;
    setExpanded?: (v: boolean) => void;
  }>();

  const isExpanded = $derived(
    props.isExpanded !== undefined ? props.isExpanded : _internalExpanded,
  );

  function setExpanded(v: boolean) {
    if (props.setExpanded) {
      props.setExpanded(v);
    } else {
      _internalExpanded = v;
    }
  }

  let title = $state("");
  let content = $state("");
  let loading = $state(false);

  let errors = $state({ title: "", content: "" });

  const validate = () => {
    errors.title = "";
    errors.content = "";

    if (!title.trim()) {
      errors.title = "Title is required";
    } else if (title.length > 50) {
      errors.title = "Max 50 characters allowed";
    }

    if (!content.trim()) {
      errors.content = "Content is required";
    } else if (content.length > 200) {
      errors.content = "Max 200 characters allowed";
    }

    return !errors.title && !errors.content;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    loading = true;

    const newNote = {
      title,
      content,
      createdAt: new Date().toISOString(),
    };

    try {
      if (!navigator.onLine) {
        const tempId = `temp_${Date.now()}`;
        pendingNotes.update((n) => [...n, { tempId, ...newNote }]);
        notes.update((n) => [{ ...newNote, id: tempId }, ...n]);
      } else {
        const res = await createNote(newNote);
        notes.update((n) => [res, ...n]);
      }

      title = "";
      content = "";
      setExpanded(false);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      loading = false;
    }
  };

  function handleCancel() {
    setExpanded(false);
    title = "";
    content = "";
    errors.title = "";
    errors.content = "";
  }
</script>

<div class="mb-4">
  {#if !isExpanded}
    <!-- TRIGGER -->
    <button
      onclick={() => setExpanded(true)}
      class="flex items-center gap-2.5 w-full px-5 py-3 rounded-xl border-[1.5px] border-dashed border-[#de5949] dark:border-[#ff7262] bg-white dark:bg-gray-900 text-[#de5949] dark:text-[#ff7262] text-sm font-semibold hover:bg-[#fff5f4] dark:hover:bg-gray-800 hover:shadow-sm transition-all duration-200"
    >
      <span
        class="w-6 h-6 rounded-full bg-[#de5949] dark:bg-[#ff7262] text-white dark:text-gray-900 flex items-center justify-center text-base font-bold"
      >
        +
      </span>
      Create New Note
    </button>
  {:else}
    <!-- FORM -->
    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      class="bg-white dark:bg-gray-900 border-[1.5px] border-[#f5b3ab] dark:border-gray-700 rounded-2xl p-6 shadow-sm"
    >
      <h3 class="text-base font-bold text-[#de5949] dark:text-[#ff7262] mb-4">
        New Note
      </h3>

      <!-- TITLE -->
      <label
        for="note-title"
        class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1"
      >
        Title
      </label>
      <input
        id="note-title"
        class="w-full bg-white dark:bg-gray-800 border-[1.5px] border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 font-[inherit] mb-1 focus:outline-none focus:border-[#de5949] dark:focus:border-[#ff7262] focus:ring-2 focus:ring-[#de594915]"
        placeholder="Give your note a title..."
        bind:value={title}
      />
      {#if errors.title}
        <p class="text-red-500 text-xs mb-3">{errors.title}</p>
      {:else}
        <div class="mb-3"></div>
      {/if}

      <!-- CONTENT -->
      <label
        for="note-content"
        class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1"
      >
        Content
      </label>
      <textarea
        id="note-content"
        class="w-full bg-white dark:bg-gray-800 border-[1.5px] border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 font-[inherit] mb-1 min-h-[100px] resize-y focus:outline-none focus:border-[#de5949] dark:focus:border-[#ff7262] focus:ring-2 focus:ring-[#de594915]"
        placeholder="Write your note here..."
        bind:value={content}
      ></textarea>
      {#if errors.content}
        <p class="text-red-500 text-xs mb-3">{errors.content}</p>
      {:else}
        <div class="mb-3"></div>
      {/if}

      <!-- BUTTONS -->
      <div class="flex gap-3 justify-end">
        <button
          type="button"
          onclick={handleCancel}
          class="px-5 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-[1.5px] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          class="px-6 py-2 rounded-lg bg-[#de5949] dark:bg-[#ff7262] text-white dark:text-gray-900 text-sm font-bold hover:bg-[#c9413b] dark:hover:bg-[#ff5a47] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Creating..." : "Create Note"}
        </button>
      </div>
    </form>
  {/if}
</div>
