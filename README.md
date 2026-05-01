# VX3 — Powerful Web3 Developer SDK

VX3 is a developer-first toolkit for building, testing, and shipping Web3
applications. It bundles a CLI, a local development node, project scaffolding,
payment / gas / IPFS helpers, and **VXC**, an in-house custom Solidity
compiler.

Parent repo & docs: <https://github.com/nk4dev/vx3>
SDK docs: <https://nknighta.me/vx>

---

## Highlights

- 🧰 **One CLI for the whole flow** — scaffold, compile, run a node, pay,
  estimate gas, pin to IPFS.
- 🛠 **VXC, a custom Solidity compiler** — own frontend (lexer, import
  resolver, artifact pipeline) with a pluggable backend. Lives at
  [`packages/vxc`](packages/vxc/README.md).
- ⚛️ **Frontend templates** — React and Vue starters, plus a Hardhat package
  pre-wired for VX3 projects.
- 🔌 **Programmatic APIs** — every CLI command is also exposed as a TypeScript
  function.

## Install

```bash
git clone https://github.com/nk4dev/vx
cd vx
npm i
npm link        # exposes the `vx3` binary globally
npm run build
```

## CLI

```bash
vx3 <command> [...options]
```

| Command | Description |
| --- | --- |
| `init` | Initialize a new project with default settings. |
| `create [name]` | Scaffold a new project (interactive if name omitted). |
| `node` | Start a local development node. |
| `setup hardhat\|react` | Add Hardhat or a React frontend to the current project. |
| `rpc` | Manage or query RPC endpoints from `vx.config.json`. |
| `pay <to> <amount>` | Send a transaction. Flags: `--rpc`, `--key`. |
| `gas` | Estimate gas fees for a transaction. |
| `ipfs` | Pin / fetch content via IPFS. |
| `generate` | Generate templates (react, vue, …). |
| **`compile <entry.sol>`** | **Compile Solidity using the VXC custom compiler.** |
| `sol hello` | Solidity helper sample. |
| `info` | Display project / SDK info. |
| `--version`, `-v` | Show SDK version. |
| `help` | Show the help screen. |

### Compiling contracts with VXC

```bash
vx3 compile contracts/Token.sol \
  --out build \
  --optimize --runs 1000 \
  --evm cancun \
  --remap @openzeppelin/=node_modules/@openzeppelin/
```

Artifacts (`<Contract>.json` + a `vxc.manifest.json`) are written to
`--out` and are deploy-ready. Full docs:
[`packages/vxc/README.md`](packages/vxc/README.md).

## Packages

| Package | Path | Purpose |
| --- | --- | --- |
| `@vx3/vxc` | `packages/vxc` | Custom Solidity compiler (frontend + pluggable backend). |
| `@vx3/hardhat` | `packages/hardhat` | Hardhat config preset for VX3 projects. |
| `@vx3/template` | `packages/template` | Default project template. |
| `@vx3/react-template` | `packages/react-template` | React starter. |
| `@vx3/vue-template` | `packages/vue-template` | Vue starter. |

## What's new in this revision

- ➕ **New `compile` CLI command** wired to the VXC custom compiler.
- ➕ **New package `@vx3/vxc`** at `packages/vxc` with its own README and
  programmatic API (`VXCompiler`, `ImportResolver`, `lex`).
- ➕ **Custom Solidity frontend**: lexer (pragmas, imports, contract decls),
  import resolver (relative paths, remappings, include paths, `node_modules`
  walk), Standard JSON pipeline, deterministic artifact format with
  `vxc.manifest.json`.
- 🔧 **Pluggable compiler backend** — `solc` by default; any
  `compile(input)`-shaped backend can be swapped in.
- 📦 **`packages/vxc` published** alongside existing templates via the
  package `files` field.

## Development

```bash
npm run build          # build SDK
npm test               # jest test suite
npm run lint           # eslint
npm run format         # prettier

# Build the VXC compiler package
cd packages/vxc && npx tsc
```

## Contact

[nknighta@varius.technology](mailto:nknighta@varius.technology)

## License

MIT
