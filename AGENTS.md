# Repository Guidelines

## Project Structure & Module Organization
This repository contains the `@harnessgg/electron` CLI package.

- `src/cli.ts`: CLI entrypoint and command routing.
- `src/commands/`: per-command handlers (`connect`, `dom`, `click`, `type`, `assert`, etc.).
- `src/runtime/`: CDP/Playwright runtime integration.
- `src/session/`: session persistence (`.harness-electron/sessions/*.json`).
- `src/contracts/`: response types and schemas.
- `test/`: Vitest unit tests.
- `docs/human/` and `docs/llm/`: human-facing and agent-facing docs.
- `dist/`: TypeScript build output (generated).

## Build, Test, and Development Commands
- `npm run build`: compile TypeScript to `dist/`.
- `npm test`: run test suite with Vitest.
- `npm run typecheck`: run strict type checks without emitting output.
- `npm run dev -- <command>`: run CLI directly from source via `tsx`.
  - Example: `npm run dev -- capabilities`
  - If command has flags, use an extra separator: `npm run dev -- click -- --text "Add Project"`
- `node dist/cli.js <command>`: run built CLI.

## Coding Style & Naming Conventions
- Language: TypeScript (ESM, strict mode).
- Indentation: 2 spaces; keep files ASCII unless existing content requires otherwise.
- Prefer small, single-purpose modules and explicit types.
- Naming:
  - Files: lowercase kebab or concise nouns (`session/store.ts`, `commands/connect.ts`).
  - Functions: `camelCase`.
  - Types/interfaces: `PascalCase`.
- Keep CLI output machine-first: one JSON object on stdout.

## Testing Guidelines
- Framework: Vitest.
- Test files: `*.test.ts` in `test/`.
- Add tests for:
  - selector parsing/validation,
  - session persistence behavior,
  - error mapping and response contracts when adding new commands.
- Run `npm test` before submitting changes.

## Commit & Pull Request Guidelines
- Current repo has no commit history yet; no enforced message convention exists.
- Recommended: Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`).
- PRs should include:
  - concise summary of behavior changes,
  - updated docs for any user-visible code change (required),
  - updated docs for CLI contract changes,
  - sample JSON output when response shape changes.

## Security & Configuration Notes
- Do not commit `.harness-electron/`, `dist/`, or `.electron/`.
- This package is intended as a dev dependency in consumer apps (`npm i -D @harnessgg/electron`).
- Avoid adding human-only output paths; preserve stable JSON for agents.
