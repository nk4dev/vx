# VX3 SDK — Known Problems

> **Status (2026-08-24): most items below have been fixed.** See the
> [Fix status](#fix-status) section at the end for what changed, what was
> intentionally left as-is, and why. The findings below are kept as the
> original audit record.

Audit of the current `dev` branch. Findings are grouped by category with
`file:line`, a description, and severity (High / Medium / Low).

## 1. Security

| Location | Issue | Severity |
| --- | --- | --- |
| `src/command/pay.ts:14-17`, `src/command/nft.ts:27` | Private key accepted via `--key` CLI flag — leaks into shell history and `ps` output. | High |
| `src/server/dev.ts:219-263` (`/api/pay`) | Local dev-node HTTP endpoint accepts a raw private key in a JSON body and signs/sends a real transaction. No auth, `Access-Control-Allow-Origin: *`. | High |
| `src/front_api/paymentdialog.tsx:1-40` | React `PaymentDialog` collects a plaintext private key in component state and POSTs it to `/api/pay`. | High |
| `src/server/dashboard.ts:169-171` | `exec(`${cmd} ${dashUrl}`)` builds a shell command from `--host`/`--port` values with no sanitization — command injection via crafted `--host` on `vx3 dash --open`. | Medium |
| `src/server/dashview.ts:151-152,248`, `src/server/webview.ts` | `host`, `port`, `rpcUrl` from CLI flags / `vx.config.json` are interpolated unescaped into served HTML/JS — reflected XSS via crafted `--host` or a shared malicious `vx.config.json`. | Medium |
| `src/command/pjmake.ts:35-51` (`init`) | `projectName` from CLI arg is `path.join`'d without sanitizing `..`/absolute paths — path traversal on `vx3 create ../../x`. | Low/Medium |
| `README.md:44` | Documents `vx3 dash --host 0.0.0.0` as a normal example with no warning that `/api/*` is unauthenticated. | Low |

## 2. Code Quality / Correctness

- **`src/core/contract.ts:3-16`** — `intstance()` (typo) calls `JSON.parse(config)` on a value `load_rpc_config()` already parsed into an object; always throws. Re-exported as `instance` from `src/index.ts:1,11`, so the public SDK API is broken. **High**
- **`src/command/cmd.ts:112`** — `catch (error) { ... error.message }` with no type guard; throws if a non-`Error` is thrown.
- **`src/libs/sign_project.ts` + `src/command/cmd.ts:37-39`** — interactive `vx3 create` (no name) only asks two readline questions and prints "project created" — never actually scaffolds any files. **Medium**
- **`src/libs/builder.ts:8`** — scaffolded project's `package.json` sets `"dev": "vx3 serve --debug"`, but `vx3 serve` (`cmd.ts:41-44`) always prints "replace command to \"node\"" and exits 1 — every new project's `dev` script is broken immediately. **Medium**
- **`src/libs/builder.ts:20`** — generated `devDependencies.typescript` pinned to `^4.0.0`, stale vs the repo's own `^5.8.3`.
- **`src/command/compile.ts:65-70`** — `require('@vx3/vxc')` can never resolve (not installed/workspaced); always falls through to the relative-path fallback — dead code path.
- **`src/core/data/index.ts`** (end of file) — stray leftover comment `// ...existing code...`.
- 151 `console.log`/`console.error` calls used as the only logging mechanism (no levels/structured logging); 12 uses of `any`/`as any` (e.g. `src/payment/index.ts:16 receipt?: any`, dashboard/webview types) weaken type safety.
- `jest.config.cjs` is unmodified boilerplate — no `collectCoverageFrom`, no coverage thresholds.

## 3. Testing

Existing tests: `test/core/ipfs.test.js`, `test/core/rpc.test.js`, `test/payment.test.js` (mocked ethers), `test/vxc/*.test.js`, `test/help.test.js` (3-case CLI smoke test).

**No coverage at all** for:
- `src/command/{dash,compile,gas,generate,ipfs,nft,pay,pjmake,setup}.ts` (beyond the generic help smoke test)
- `src/nft/index.ts`
- The entire `src/server/*` tree — `dashboard.ts`, `dev.ts` (including the fund-moving `/api/pay` route), `webview.ts`, `dashview.ts`
- All of `src/front_api/*` (React hooks/components)
- `src/libs/*` — the broken `builder.ts` / `sign_project.ts` bugs above would have been caught by tests
- `src/core/contract.ts` — the broken `instance()` bug would have been caught
- `src/core/sdk.ts`

`.github/workflows/ci.yml` triggers only on `workflow_dispatch`, not on push/PR — tests never actually gate merges. **High (process)**

## 4. Documentation

- **`README.md:47`** — documents `node` as starting on "port 3000"; actual default in `src/server/dev.ts:63` is `'8545'`. **High**
- **`llms.txt`** references `docs/llm/overview.md`, `installation.md`, `commands.md`, `usage.md`; `docs/` only contains `index.html` — all four are broken links. **High**
- README's Japanese section links `docs/ja/guide.md`, which doesn't exist.
- `package.json` `"files"` lists `"packages/components"`, a directory that doesn't exist in the repo.
- `src/config.ts:1` `SDK_VERSION = '0.0.2'` vs `package.json` `"version": "0.1.1"` — `vx3 --version` reports a stale, mismatched version.
- README's Install/Development sections use `npm i` / `npm run build` / `npm link` / `npm test` throughout, but `package.json`'s own `prepare`/`start` scripts call `bun run build` / `bunx vx serve`, matching recent history ("update: replace npm to bun") that README was never updated for.
- `.env.example` only documents `NODE_URL` (never read anywhere in `src`), and omits `PRIVATE_KEY`, the only env var actually consumed (`pay.ts:41`, `nft.ts:54`, `dev.ts:230`).

## 5. Build / Tooling Config

- `tsconfig.json` has no `strict` / `noImplicitAny` — consistent with the loose `any` usage and unguarded `error.message` catches above.
- `eslint.config.js` — both rule blocks are `rules: {}`; `typescript-eslint` is parsed but its recommended rule sets are never applied, so TS-specific linting is effectively disabled.
- `.github/workflows/ci.yml` uses `npm ci` / `npm run build` / `npm test`, but `npm test`'s `pretest` hook (`package.json`) runs `bun run build:vxc && bun run build`; the CI runner only installs Node via `actions/setup-node`, never `bun` — CI would fail if it ever ran (and it's manual-only, per above).
- Dev-only tooling declared as production `dependencies` rather than `devDependencies`: `prettier`, `globals`, `@types/*` packages, `@nomicfoundation/hardhat-toolbox`.
- Missing dependency: `react` is imported directly (`src/front_api/paymentdialog.tsx:1`, hooks) but not listed anywhere in `package.json` (only `@types/react` / `@types/react-dom` / `react-dom` exist).
- Unused dependencies: `@types/supertest` (supertest never imported anywhere); `minimatch` (only referenced by its own ambient `src/types/minimatch.d.ts` declaration, never actually called).

## 6. Project Structure

- `package.json` `"files"` references nonexistent `packages/components` (also a doc issue).
- `src/core/contract.ts:3` — function named `intstance` (typo), re-exported as `instance`.
- `src/command/cmd.ts:10` — `setup.ts` is loaded via `require()` while every other command module in the same file uses ES `import` — inconsistent module style.
- SSE/dashboard-serving logic (RPC-list reading, block/gas polling loop, `/api/block`, `/api/gas`) is near-duplicated between `src/server/dev.ts` and `src/server/dashboard.ts` rather than shared.

## 7. Git / Repo Hygiene

- `.gitignore` contains a bare `config` entry — overly broad; would silently hide any file/directory literally named `config` anywhere in the tree.
- `bun.lock` is gitignored even though the project's own `prepare`/`start` scripts depend on `bun` — no committed lockfile for reproducible installs.
- No committed secrets found; `.env.example` and `vx.config.json` only contain localhost placeholders.

---

## Suggested priority order

1. **High-severity security**: private key handling over CLI flags / HTTP body / component state (§1).
2. **High-severity correctness**: broken `instance()` export, broken `vx3 --version`, wrong documented default port (§2, §4).
3. **CI**: wire `ci.yml` to run on push/PR, and make it actually use `bun` so it can pass (§3, §5).
4. **Docs**: fix npm→bun install instructions, remove/repoint dead `docs/llm/*` and `docs/ja/guide.md` links, fix `.env.example` (§4).
5. Everything else (lint config, dependency cleanup, duplicated server code) as follow-up hygiene work.

## Fix status

### Fixed

- **§1 Security** — `/api/pay` no longer accepts a private key over the network (signs with `PRIVATE_KEY` env or a generated dev account only); it now rejects cross-origin requests (same-origin check on the `Origin` header) to close the CSRF/DNS-rebinding drain path. `dashboard.ts`'s `--open` handler now uses `spawn` with an argv array instead of `exec("$cmd $url")`, closing the command-injection vector. `dashview.ts`/`webview.ts` now HTML-escape `host`/`port`/`rpcUrl` before interpolating them into served HTML (new `src/libs/html.ts` helper), and JSON embedded in `<script>` blocks is now escaped against `</script>` breakout. `pjmake.ts`'s `init()` now rejects absolute paths and `..` segments in the project name. `pay`/`nft` now print a warning when `--key` is used. The orphaned `paymentdialog.tsx` (plaintext private-key field, POSTed to the server, never actually built or exported) was deleted rather than patched — `payment.ts`'s `Payment` component already covers this without the key field.
- **§2 Correctness** — `instance()` (the `intstance` typo) no longer double-JSON-parses an already-parsed config and no longer always throws; it's exported correctly from `src/index.ts`. `SDK_VERSION` now matches `package.json` (`vx3 --version` reports `0.1.1`, verified). The dead `sign_project.ts` (unused, duplicated the working `input.ts` flow) was deleted. Scaffolded projects' generated `package.json` now has a working `dev` script (`vx3 node --debug` instead of the always-failing `vx3 serve --debug`) and a current `typescript` devDependency. The stray `// ...existing code...` comment was removed. `tsconfig.json` now has `"strict": true` — the ~16 resulting type errors (mostly untyped `catch` params) were fixed across `cmd.ts`, `rpc.ts`, `ipfs.ts`, `generate.ts`, `core/rpc/*`, `examples/rpc-examples.ts`; `bun run build` and the full test suite (75 tests) still pass.
- **§4 Documentation** — README's install/dev sections now use `bun` (matching `package.json`'s actual scripts) instead of `npm`; the documented `node` default port is now `8545` (was wrongly `3000`) in both language sections; the dangling `docs/ja/guide.md` link was removed; a security note about `--host 0.0.0.0` was added to both language sections. `llms.txt` no longer points at four `docs/llm/*.md` files that don't exist — it now points at what's actually in the repo (`README.md`, `docs/index.html`) plus the real hosted docs site. `package.json`'s `files` no longer lists the nonexistent `packages/components`. `.env.example` now documents `PRIVATE_KEY`, the env var the code actually reads.
- **§5 Build/Tooling** — `eslint.config.js` now applies `typescript-eslint`'s recommended rules (previously both rule blocks were empty `{}`, so TS-specific linting was silently off). `.github/workflows/ci.yml` now triggers on `push`/`pull_request` (was `workflow_dispatch`-only, so it never gated merges) and uses `bun` throughout instead of `npm`, matching the project's actual toolchain. `package.json` moved dev-only tooling (`prettier`, `globals`, `@types/*`, `@nomicfoundation/hardhat-toolbox`) into `devDependencies`, added the missing `react` runtime dependency, and dropped the unused `@types/supertest` and `minimatch`. The `start` script's `bunx vx serve --debug` (a different, non-existent `vx` package, and `serve` is a dead command) was fixed to `node dist/src/cli.js node --debug`.
- **§7 Git hygiene** — the overly broad bare `config` `.gitignore` entry was removed (nothing in the repo is named `config`; it would have silently hidden any such file/directory). `bun.lock` is no longer gitignored, since the project's own `bun`-based scripts depend on it for reproducible installs — it's now available to commit (not committed automatically; see below).

### Intentionally left as-is / deferred

- **§3 Testing** — writing tests for `src/server/*`, `src/command/{dash,compile,gas,generate,ipfs,nft,pay,pjmake,setup}.ts`, `src/nft`, `src/front_api`, and `src/libs` is a substantial standalone effort (dozens of new test files) and wasn't attempted here. CI now at least runs the existing suite on every push/PR.
- **`eslint.config.js` rule fallout** — enabling `typescript-eslint` recommended surfaced 38 pre-existing errors (mostly `no-explicit-any` and a few `no-unused-vars`) that weren't individually itemized in the original audit. They weren't fixed here to keep this pass scoped to the audit's findings; run `bun run lint` to see them.
- **`src/types/minimatch.d.ts`** — left in place even though the `minimatch` package itself was removed from `package.json`, since it's an inert ambient declaration (nothing imports `'minimatch'`) and deleting it carried an untested risk of a transitive type conflict from `@nomicfoundation/hardhat-toolbox`.
- **`react` as a `dependency` vs `peerDependency`** — added to `dependencies` per the audit's literal finding ("missing dependency"). A component-shipping SDK would more idiomatically use `peerDependencies` for `react`/`react-dom` to avoid duplicate React copies in consumers' apps; that's a design decision beyond a "fix the bug" pass.
- **Duplicated SSE/dashboard logic between `dev.ts` and `dashboard.ts`** (§6) — not refactored; both still work correctly, and merging them is a structural change beyond a corrections pass.
- **`bun.lock` was not committed** — the `.gitignore` entry was removed so it *can* be committed, but committing it wasn't done automatically per this session's git policy (commits only happen when explicitly requested). Run `git add bun.lock` and commit when ready.
