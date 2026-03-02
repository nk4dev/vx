# VX — Web3 Development Toolkit for VX3

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)

master: [![CI](https://github.com/nk4dev/vx/actions/workflows/ci.yml/badge.svg)](https://github.com/nk4dev/vx/actions/workflows/ci.yml/badge.svg?branch=master)
dev: [![CI](https://github.com/nk4dev/vx/actions/workflows/ci.yml/badge.svg)](https://github.com/nk4dev/vx/actions/workflows/ci.yml/badge.svg?branch=dev)

A collection of Web3 development utilities. Supports project creation, RPC connection, gas inspection, local dev server, and more.

> **Warning:** This project is under active development and has not yet been officially released. Use at your own risk.

Updates: https://nknighta.me/vx  
vx3: https://nknighta.me/dev/vx3

This project partially uses AI code generation tools:
- GitHub Copilot
- Google Gemini
- NotebookLM

## Features

- Connect to multiple chains (ethers v6)
- Wallet creation and management
- Local development server with a simple API
- Deploy / compile examples (bundled Hardhat sample included)

## Requirements

- Node.js 18+ (required when using built-in `fetch`)
- npm (or pnpm / yarn / Bun)

## Development Install

```powershell
npm install
npm run build
# Run the built CLI
node .\dist\src\cli.js --help
```

To symlink for local testing:

```powershell
npm link
vx3 --help
```

After publishing, use temporarily with: `npx vx3 <command>`

## Quick Start

Create a new project (non-interactive):
```powershell
vx3 create my-app
```

Create a new project (interactive):
```powershell
vx3 create
```

Initialize RPC config template:
```powershell
vx3 rpc init
```

Start local dev server (with debug output):
```powershell
vx3 serve --debug
```

Check gas fees:
```powershell
vx3 gas
```

## Using as a Library (Import)

You can use the SDK programmatically via the default export. All CLI features remain available.

TypeScript / ESM:
```ts
import vx from "@nk4dev/vx";

const rpc = vx.getRpcUrl(); // reads from vx.config.json
const block = await vx.getBlockNumber(rpc);
const gas = await vx.getGasFees(rpc);
```

CommonJS:
```js
const vx = require("@nk4dev/vx").default;
vx.getGasFees("http://127.0.0.1:8545").then(console.log);
```

Named exports are also available for backward compatibility:
```ts
import { vx as data, instance } from "@nk4dev/vx";
await data.getBalance("http://127.0.0.1:8545", "0x...");
```

## Project Creation (Template Copy)

`vx3 create <name>` (or `vx3 init <name>`) recursively copies the contents of `packages/template` in the repository into a new `<name>` folder in the current directory. A `package.json` is also generated.

Template examples:
- `packages/template/sample.js`
- `packages/template/sample.sol`
- `packages/template/vx.config.json`
- `packages/template/contracts/Sample.sol`

Template lookup order (handles differences between dev and dist environments):
1. From dist: `../../packages/template`
2. From TS source: `../../../packages/template`
3. Repo root: `<cwd>/packages/template`

If none are found, a warning is printed and a minimal set (just `package.json`) is created.

## Hardhat Setup

Scaffold Hardhat files into the current project:

```powershell
vx3 setup hardhat
# Then install devDependencies
npm install -D hardhat @nomicfoundation/hardhat-toolbox

# Try the scripts
npm run hh:node
npm run hh:compile
npm run hh:deploy
```

This command will:
- Add / merge npm scripts: `hh`, `hh:compile`, `hh:test`, `hh:node`, `hh:deploy`
- Add `hardhat` and `@nomicfoundation/hardhat-toolbox` to `devDependencies`
- Copy template files if available:
  - `hardhat.config.ts`
  - `contracts/Sample.sol`
  - `scripts/deploy.ts`

## RPC Configuration (vx.config.json)

`vx3 rpc init` creates an RPC config template. `vx.config.json` accepts an array of endpoint definitions.

Each entry can represent a standard RPC (http/https/ws/wss) or an IPFS gateway. Key fields:
- `type` (optional): `rpc` (default) or `ipfs`
- RPC: `host`, `port`, `protocol` (`http`/`https`/`ws`/`wss`)
- IPFS: `gateway` (e.g. `https://ipfs.io`) or `api` object (`host`/`port`/`protocol`)

Example:

```json
[
  {
    "host": "localhost",
    "port": 8545,
    "protocol": "http",
    "type": "rpc"
  },
  {
    "host": "rpc.example.com",
    "port": 443,
    "protocol": "https",
    "type": "rpc"
  },
  {
    "type": "ipfs",
    "gateway": "https://ipfs.io"
  }
]
```

Generate a template via CLI:

```powershell
vx3 rpc init
```

## Debug Page (Simple CSS UI)

`vx3 serve --debug` serves a simple CSS-based debug dashboard at `/debug`:
- Displays server host and latest block number
- Quick links: `/api`, `/api/block`
- Usage examples (fetch)

### Example Gas Command Output

```
Connecting to RPC: http://localhost:8545
Gas fee data:
  gasPrice (wei): 20000000000
  gasPrice (gwei): 20
  maxFeePerGas (wei): 2532616788
  maxFeePerGas (gwei): 2.532616788
  maxPriorityFeePerGas (wei): 1000000000
  maxPriorityFeePerGas (gwei): 1
```

## Libraries Used

- [express](https://expressjs.com/) — debug / local server
- [ethers.js](https://docs.ethers.org/) — RPC / blockchain operations

## Planned UI Framework Support

- React => [react-payment.md](docs/react-payment.md)
- Vue.js
- Svelte
- Next.js

## Payment Module — API & CLI (Bun Runtime)

A reusable payment module has been added, usable from both the CLI and programmatically.

**What was added:**
- `src/payment/index.ts` — helper exporting `sendPayment(options)`
- `src/command/pay.ts` — CLI wrapper that calls `sendPayment`
- `src/index.ts` — library entry exposes the `payment` namespace (`vx.payment.sendPayment(...)` or `import { payment } from '@nk4dev/vx'`)

### Programmatic Usage

TypeScript / ESM:
```ts
import vx from '@nk4dev/vx';

await vx.payment.sendPayment({
  rpcUrl: 'http://127.0.0.1:8545',
  privateKey: process.env.PRIVATE_KEY!,
  to: '0xRecipientAddressHere',
  amountEth: '0.01'
});
```

Named import:
```ts
import { payment } from '@nk4dev/vx';
await payment.sendPayment({ rpcUrl, privateKey, to, amountEth: '0.01' });
```

### CLI Usage (recommended: pass private key via environment variable)

```powershell
# $env:PRIVATE_KEY='0x...'
vx3 pay 0xRecipientAddress 0.01 --rpc http://127.0.0.1:8545
```

## Build with Bun

Bun is the recommended runtime for this project:

```powershell
# Install dependencies with Bun
bun install
# Build TypeScript
bun run build
```

### Known Build Notes

- Running `bun install` + `bun run build` may produce a few TypeScript diagnostics.
- Common issues:
  1. **Missing `ethers` type declarations** ("Cannot find module 'ethers' or its corresponding type declarations").  
     Fix:
     ```powershell
     bun add ethers
     bun run build
     ```
     Or run `npm install ethers`.
  2. `packages/react-template/tsconfig.json` references `vite/client` types and may use a deprecated `moduleResolution` setting — informational only. Add Vite types or fix tsconfig if compiling that template.

## Security Notes

- Avoid passing secrets on the command line. Use environment variables (e.g. `PRIVATE_KEY`) or an external signer.
- The current `sendPayment` accepts a raw hex private key. For production, consider integrating a hardware wallet, managed signer, or key management provider.

## Author

Maintainer: [nk4dev](https://nk4dev.github.io/)