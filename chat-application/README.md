# ChatApp

ChatApp is a Tauri 2 desktop chat application with a React frontend, a Rust backend, and a local PostgreSQL database. It supports authenticated users, direct messages, and room-based group chat with private and public room controls.

## Features

- Username and password authentication
- Unique usernames enforced by the backend and database
- Secure password hashing with Argon2
- Optional display name during sign up
- Direct one-to-one messages between users
- Group rooms with create, browse, join, leave, and delete actions
- Public rooms anyone can join
- Private rooms protected by a code
- Owner-only room deletion
- Leave-room flow without deleting the room
- Rename profile display name
- Automatic discovery of DM partners in the sidebar
- Text-only messaging for now
- Modal-based confirmations for sensitive actions
- PostgreSQL-backed persistence

## Tech Stack

- Frontend: React + Vite
- Backend: Rust + Tauri 2
- Database: PostgreSQL
- Password hashing: Argon2

## Requirements

- Node.js 18 or newer
- pnpm
- Rust toolchain
- PostgreSQL running locally

## Database Setup

This app expects a local PostgreSQL database named `chat_app_with_tauri`.

Default connection settings used by the backend:

- Host: `localhost`
- User: `postgres`
- Password: `admin123`
- Database: `chat_app_with_tauri`

Make sure the database exists before launching the app.

## Install and Run

### Development

1. Install dependencies:

```bash
pnpm install
```

2. Start the app in development mode:

```bash
pnpm tauri dev
```

### Production Build

1. Build the production bundle:

```bash
pnpm tauri build
```

2. The installers are generated under `src-tauri/target/release/bundle`.

## Direct Download and Install

If you publish releases, users can install ChatApp directly from the release artifacts instead of building it locally.

Recommended release files:

- Windows: `.msi` or `.exe`
- Linux: `.AppImage`, `.deb`, or `.rpm`
- macOS: `.dmg` or `.app` bundle

After publishing a release, add the download link here or in your GitHub Releases page so users can install the app directly.

## Production Notes

- Passwords are never stored in plain text.
- Username uniqueness is enforced in the database.
- Room deletion is validated server-side so only the creator can delete a room.
- Room deletion and leave-room actions use transactions to keep the database consistent.
- Sensitive actions use confirmation modals instead of native browser dialogs.
- DM partner discovery is refreshed automatically in the UI.

## Project Structure

- `src/` - React frontend
- `src/components/` - Chat UI components
- `src/components/modals/` - Reusable modal dialogs
- `src-tauri/` - Rust backend and Tauri configuration

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, workflow, and contribution guidelines.

## License

No license file has been added yet. Add one before publishing the project publicly.
