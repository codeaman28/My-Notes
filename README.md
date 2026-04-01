4aaabd55b81461beca1998f6748e9884db864b1fd5e34000759e996ec3dd4c46

# 📝 Notes App (SvelteKit)

## 🔗 Live Demo

https://my-notes-tawny.vercel.app/

---

## 🚀 Features

### Core Features (Assignment Requirements)

- Create, edit, and delete notes
- Soft delete with undo (10s recovery)
- Debounced search
- Search text highlighting
- Sorting (title, date, id)
- Pagination (20 notes per page)
- Dark mode toggle
- Keyboard shortcuts (Ctrl + N, Esc)
- Offline sync with automatic background synchronization
- Responsive UI (mobile + desktop)

---

### ⭐ Additional Features

- Pin important notes
- Smooth UI animations
- Improved UX with structured layouts

---

## 🛠 Tech Stack

- SvelteKit (Svelte 5)
- TypeScript
- TailwindCSS
- MockAPI

---

## ⚙️ How to Run

```bash
npm install
npm run dev
```

---

## 📦 Deployment

Deployed using Vercel

---

## 💡 Approach

The application is designed with a strong focus on performance and user experience.

- Implemented optimistic UI updates for faster interactions
- Used Svelte stores for centralized state management
- Built an offline-first system using localStorage and sync queues
- Maintained modular component structure for scalability
