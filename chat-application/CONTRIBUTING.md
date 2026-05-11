# Contributing

Thanks for helping improve ChatApp.

## Setup

1. Clone the repository.
2. Install dependencies:

```bash
pnpm install
```

3. Make sure PostgreSQL is running locally and the `chat_app_with_tauri` database exists.
4. Start the app in development mode:

```bash
pnpm tauri dev
```

## Development Workflow

- Keep changes focused and small.
- Use the existing React and Rust style already in the project.
- Prefer backend validation for sensitive actions such as authentication, room deletion, and room membership changes.
- Reuse the existing modal system for confirmation dialogs.
- Test the flow you changed before opening a pull request.

## Before Submitting

- Run a build or check command for the area you changed.
- Verify the app starts and the feature works end to end.
- Avoid unrelated formatting or refactors unless they are required for the fix.

## Suggested Checks

Frontend only:

```bash
pnpm build
```

Backend only:

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

Full app:

```bash
pnpm tauri build
```

## Pull Requests

Please include:

- A short description of the change
- Screenshots or notes for UI changes
- Any database or schema notes if backend behavior changed
- Validation steps you ran

## Notes

- The app uses a local PostgreSQL database by default.
- Authentication uses username and password with Argon2 hashing.
- Room ownership and membership are enforced on the backend.
