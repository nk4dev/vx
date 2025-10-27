<!-- .github/copilot-instructions.md - guidance for AI coding agents working on the VX repo -->
# Quick orientation for AI coding agents

- using bun.sh

This repository implements a small TypeScript CLI SDK for Web3 workflows (vx / vx3). The goal of these instructions is to help an AI coding agent be immediately productive when making changes, fixes, or new features.

Keep this file short and focused: reference code locations and concrete examples you can use when editing the codebase.

## Big-picture architecture
- CLI entry: `src/cli.ts` — boots `src/command/main.ts` which implements top-level commands (init, create, serve, rpc, etc.).
- Core modules: `src/core/*` contain RPC and data helpers:
  - `src/core/rpc/*` — RPC configuration management and CLI subcommands (init/view/load).
  - `src/core/data/index.ts` — ethers.js wrappers used by the local dev server (getBlockNumber, getBalance, getGasFees).
  - `src/core/contract.ts` — thin helper that loads RPC config and exposes `getRpcUrl()` used by server code.
- Server: `src/server/dev.ts` — a tiny HTTP dev server used by `vx serve`. It calls into `core/data` and `core/contract` for RPC-driven values.
- Exports: `src/index.ts` re-exports core runtime (`instance` from `src/core/contract.ts`).

Why it is structured this way:
- Minimal CLI-first design: the repo is primarily a CLI SDK with a few runtime helpers. Most logic is synchronous CLI handlers and small helper modules.
- Clear separation: RPC config and network helpers live in `core/rpc` and `core/data` so tests and dev server can share them.

## Developer workflows (build / test / run)
- Build (TypeScript -> dist): `npm run build` (runs `rimraf dist && tsc`).
- Run CLI from built output: `npm run dev` (runs `node dist/cli.js`).
- Start (build + serve): `npm run start` (builds then runs `npx vx serve --debug`). Note: `npx vx` expects published/installed binary; for local testing prefer `npm run dev` or `node ./dist/cli.js`.
- Tests: `npm test` (jest). Use `npm run test:watch` for local TDD.

If modifying runtime code, run `npm run build` and then `npm run dev` to exercise CLI commands.

## Project-specific conventions & patterns
- Config file name: `vx.config.json` (created by `src/core/rpc/config.ts`). Many functions expect this file in the current working directory.
- RPC config shape: code expects either an array of objects or a single object depending on module versions. Typical shape written by `rpc_create_config()` is an array: `[ { "host": "localhost", "port": 8575, "protocol": "http" } ]`. But some readers (e.g. `getRpcUrl()` in `src/core/contract.ts`) expect a single object. When changing code, keep this inconsistency in mind and prefer normalizing to a single canonical shape.
- Error handling: CLI code usually logs errors and calls `process.exit(code)`. Preserve this behavior unless intentionally refactoring to throw errors.
- Module imports: most files use ES module `import`/`export`. Build uses `tsc` and outputs to `dist` (configured in tsconfig.json).

## Integration points and external dependencies
- ethers v6 is used for RPC and on-chain read helpers (`src/core/data/index.ts`). Use `ethers.JsonRpcProvider` and related v6 APIs.
- Solidity compiler: `solc` is listed as a dependency — used in templates or examples (not central in current source files).
- The CLI binary name in `package.json` is `vx3` pointing to `./dist/cli.js` after build.

## Patterns to follow when editing
- When adding new CLI subcommands, add a case to the switch in `src/command/main.ts` and, if the command deals with RPC, add a subcommand under `src/core/rpc/command.ts`.
- When reading `vx.config.json`, prefer `load_rpc_config()` in `src/core/rpc/connect.ts`. But note this file contains merge conflict markers and dual implementations — check and run tests after edits.
- When making network calls, return Promises (async/await or then) consistent with existing helpers (e.g. `getBlockNumber(provider)` returns a Promise<number>).

## Files to inspect for common changes (quick links)
- CLI dispatch: `src/command/main.ts`
- RPC management: `src/core/rpc/connect.ts`, `src/core/rpc/config.ts`, `src/core/rpc/command.ts`
- Network helpers: `src/core/data/index.ts`
- Dev server: `src/server/dev.ts`

## Concrete examples
- Show RPC URL to user (existing implementation):
  - `src/core/contract.ts` reads config and constructs: `${protocol}://${host}:${port}`
- Create vx.config.json (CLI): `vx rpc init` -> `src/core/rpc/config.ts` writes an array placeholder.

## Known repository issues an agent should watch for
- `src/core/rpc/connect.ts` contains leftover merge conflict markers and two different implementations. Fixes here must normalize to one working implementation and update tests.
- Inconsistent RPC config shape: some readers expect an array (index 0), others expect a plain object. Pick one canonical representation and update callers.

## Quick editing checklist for PRs
1. Run TypeScript build: `npm run build` — fix compile errors.
2. Run unit tests: `npm test` — address failing tests.
3. Exercise CLI flows locally: `npm run dev` then `node dist/cli.js rpc init` / `node dist/cli.js serve --debug`.
4. Ensure `vx.config.json` creation and reading round-trips (init -> view -> used by server).

## If you need more context or permission
- Ask for sample `vx.config.json` expected shape or confirm whether we should migrate to a single-object config.

---
If anything here is unclear or you'd like me to expand an area (examples, snippets, or to normalize `vx.config.json` handling), tell me which part to update and I'll iterate.
