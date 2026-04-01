import type { Note } from "../types/note";

const BASE_URL = "https://69cbbef60b417a19e07b2d87.mockapi.io/notes";

export const fetchNotes = async (): Promise<Note[]> => {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Failed to fetch notes");
  return res.json();
};

export const createNote = async (note: Partial<Note>) => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note),
  });

  if (!res.ok) throw new Error("Failed to create note");
  return res.json();
};

export const updateNote = async (id: string, note: Partial<Note>) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note),
  });

  if (!res.ok) throw new Error("Failed to update note");
  return res.json();
};

export const deleteNote = async (id: string) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to delete note");
  return res.json();
};
