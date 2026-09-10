# Zenith Tasks - Dynamic Workspace

Zenith Tasks is a sleek, modern, glassmorphic task management web application designed to help users organize their daily activities. It features a responsive UI with dark/light mode, a drag-and-drop Kanban board, powerful filtering/sorting, ambient background animations, and an offline-ready Progressive Web App (PWA) architecture.

## Features

- **Interactive Kanban Board**: A beautiful drag-and-drop interface to move tasks seamlessly between "To Do", "In Progress", and "Done" columns.
- **Glassmorphic UI & Ambient Animations**: A gorgeous, modern design featuring glass panels and slow-moving, animated ambient glow elements that breathe life into the background.
- **Quick Add**: Instantly brain-dump new tasks directly into your "To Do" column using the inline quick-add field.
- **Confetti Celebrations**: Satisfying, explosive confetti animations trigger whenever you crush a task and mark it as "Done"!
- **Progressive Web App (PWA)**: Built-in Service Worker and manifest file ensure the app caches locally, allowing for blazing fast loads and offline support.
- **Persistent Storage**: All tasks and column states are automatically synced to your browser's `localStorage` so you never lose your data.
- **Theme Toggling**: Switch between Light and Dark modes seamlessly.
- **Advanced Filtering & Sorting**: Filter by category or search by text. Sort by due date, priority, or creation date.
- **Dashboard Statistics**: Visual progress ring and real-time statistics tracking your productivity.

## Technologies Used

- **HTML5** (Drag and Drop API, Semantic structure)
- **CSS3** (Custom properties, Flexbox/Grid, Glassmorphism, Advanced `@keyframes` animations)
- **Vanilla JavaScript** (ES6+, DOM Manipulation, Event Delegation, LocalStorage)
- **Service Workers** (Caching, Offline Support)
- **Libraries**: `canvas-confetti` (for animations), `marked.js` (for markdown parsing), `Chart.js`

## How to Run

1. Clone the repository to your local machine.
2. Open the project folder.
3. Serve the directory using a local web server to avoid CORS issues and enable the Service Worker. For example, using Python:
   ```bash
   python -m http.server 8080
   ```
4. Navigate to `http://localhost:8080` in your web browser.

> **Note**: Because this application uses an aggressive Service Worker for offline support, if you make changes to the source code, you must either bump the `CACHE_NAME` in `sw.js` or perform a **Hard Refresh** (`Ctrl` + `F5`) in your browser to see the latest changes.
