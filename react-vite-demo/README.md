# Todo — React + Vite + Tauri

A minimal Todo desktop app built with React + Vite and configured for Tauri.

Quick start

1. Open a terminal and change into the app folder:

```bash
cd react-vite-demo
```

2. Install dependencies:

```bash
pnpm install
# or: npm install
```

3. Run the web dev server:

```bash
pnpm dev
# or: npm run dev
```

4. Run the desktop app (Tauri):

```bash
pnpm tauri dev
# or: npm run tauri dev
```

Build for production:

```bash
pnpm build
pnpm tauri build
```

Notes

- This app stores todos in `localStorage` for simplicity.
- Ensure Rust and Tauri prerequisites are installed: https://tauri.app/
# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
