# VX - Web3 Development Toolkit for VX3

Useful web3 development tools for creating projects, connecting to RPCs, checking gas, and running a local dev server.

Status: active development (not yet released)

update here: https://nknighta.me/vx
vx3: https://nknighta.me/dev/vx3


this project using code generation AI tools.
- GitHub Copilot [GPT-5, Claude sonnet 4, GPT-5 mini, grok code fast]
- Google Gemini
- NotebookLM

## Features
- Connect to multiple chains (ethers v6)
- Create and manage wallets
- Local development server with simple APIs
- Deploy/compile examples (Hardhat samples included)

## Requirements
- Node.js 18+ (recommended; required for built-in `fetch` usage)
- npm (or pnpm/yarn)

## Installation (local dev)
```powershell
npm install
npm run build
# Run the CLI (built output)
node .\dist\src\cli.js --help
```

Or link the CLI name for local testing:
```powershell
npm link
vx3 --help
```

For one-off usage when published: `npx vx3 <command>`

## Quick start
- Create a new project (non-interactive):
```powershell
vx3 create my-app
```
- Create a new project (interactive prompt):
```powershell
vx3 create
```
- Initialize RPC config template:
```powershell
vx3 rpc init
```
- Start local dev server (with debug view):
```powershell
vx3 serve --debug
```
- Check gas info:
```powershell
vx3 gas
```

## Library usage (import)
You can use the SDK programmatically via the default export, while CLI features remain unchanged.

TypeScript/ESM:
```ts
import vx from "@nk4dev/vx";

const rpc = vx.getRpcUrl(); // from vx.config.json
const block = await vx.getBlockNumber(rpc);
const gas = await vx.getGasFees(rpc);
```

CommonJS:
```js
const vx = require("@nk4dev/vx").default;
vx.getGasFees("http://127.0.0.1:8545").then(console.log);
```

Named exports are still available for backward compatibility:
```ts
import { vx as data, instance } from "@nk4dev/vx";
await data.getBalance("http://127.0.0.1:8545", "0x...");
```

## Project creation (template copy)
`vx3 create <name>`（または `vx3 init <name>`）は `packages/template` の中身を、カレントディレクトリ直下の `<name>` フォルダに再帰コピーします。コピー先には `package.json` も生成されます。

テンプレート内容の例:
- `packages/template/sample.js`
- `packages/template/sample.sol`
- `packages/template/vmx.config.json`
- `packages/template/contracts/Sample.sol`

テンプレートディレクトリの解決は以下の候補を順に探索します（開発/配布の差異を吸収）:
1) `dist` 実行時: `../../packages/template`
2) TS 実行/構成差異: `../../../packages/template`
3) リポジトリ直下: `<cwd>/packages/template`

when not found, it will issue a warning and create only a minimal setup (`package.json`).

## Hardhat setup
Scaffold Hardhat files into the current project:

```powershell
vx3 setup hardhat
# then install dev dependencies
npm install -D hardhat @nomicfoundation/hardhat-toolbox

# try scripts
npm run hh:node
npm run hh:compile
npm run hh:deploy
```

This command:
- Adds/merges scripts: `hh`, `hh:compile`, `hh:test`, `hh:node`, `hh:deploy`
- Adds devDependencies: `hardhat`, `@nomicfoundation/hardhat-toolbox`
- Copies templates when available:
  - `hardhat.config.ts`
  - `contracts/Sample.sol`
  - `scripts/deploy.ts`

## RPC configuration（vx.config.json）

`vx3 rpc init` creates an RPC configuration template. The current template is an array, and the loader uses the first object.

```json
[
  { "host": "localhost", "port": 8575, "protocol": "http" }
]
```

In the future, we may standardize on a single object format.

## Debug page (Tailwind UI)
`vx3 serve --debug` serves a TailwindCSS-powered debug dashboard at `/debug`:
- Shows server host and the latest block number
- Quick links: `/api`, `/api/block`
- "Usage" section with example fetch calls

### Gas Command Example Output
```text
Connecting to RPC: http://localhost:8545
Gas fee data:
  gasPrice (wei): 20000000000
  gasPrice (gwei): 20
  maxFeePerGas (wei): 2532616788
  maxFeePerGas (gwei): 2.532616788
  maxPriorityFeePerGas (wei): 1000000000
  maxPriorityFeePerGas (gwei): 1
```


## Libraries
- express（debug/local server）
- ethers.js（RPC/chain operations）

## UI frameworks that will be supported in the future 
- React
- Vue.js
- Svelte
- Next.js

## Author
Maintainer: [nk4dev](https://nk4dev.github.io/)