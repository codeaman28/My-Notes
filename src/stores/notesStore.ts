import { writable } from "svelte/store";
import type { Note } from "$lib/types/note";

export const notes = writable<Note[]>([]);
export const loading = writable<boolean>(false);
export const error = writable<string | null>(null);
export const deletedNote = writable<Note | null>(null);

// Notes created while offline — tempId links the store entry to the pending record
export interface PendingNote {
  /** e.g. "temp_1743446825123" — matches the id stored in notes */
  tempId: string;
  title: string;
  content: string;
  createdAt: string;
}

export const pendingNotes = writable<PendingNote[]>([]);
