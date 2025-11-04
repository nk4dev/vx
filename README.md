# VX - Web3 Development Toolkit for VX3

Useful web3 development tools for creating projects, connecting to RPCs, checking gas, and running a local dev server.

> [!WARNING]
> This project is in active development and has not yet been officially released. Use at your own risk.

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
`vx3 create <name>` (or `vx3 init <name>`) recursively copies the contents of `packages/template` to the `<name>` folder directly under the current directory. A `package.json` file is also generated in the destination directory.

Template content examples:
- `packages/template/sample.js`
- `packages/template/sample.sol`
- `packages/template/vmx.config.json`
- `packages/template/contracts/Sample.sol`

Template directory resolution searches the following candidates in order (accommodating development/distribution differences):
1) When running `dist`: `../../packages/template`
2) When running TS/config: `../../../packages/template`
3) Directly under the repository: `<cwd>/packages/template`

If not found, it will issue a warning and create only a minimal setup (`package.json`).
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

## Payment module — API and CLI (Bun runtime)

This repository now includes a reusable payment module that can be used both from the CLI and programmatically from your code.

What was added
- `src/payment/index.ts` — a small helper that exports `sendPayment(options)`.
- `src/command/pay.ts` — CLI wrapper that calls `sendPayment`.
- `src/index.ts` — the library entry now exposes the payment namespace so you can call it from code: `vx.payment.sendPayment(...)` or `import { payment } from '@nk4dev/vx'`.

Programmatic usage

TypeScript/ESM example:
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

CLI usage (recommended: use environment variable for private key):
```powershell
#$env:PRIVATE_KEY='0x...'
vx3 pay 0xRecipientAddress 0.01 --rpc http://127.0.0.1:8545
```

Run/Build (using Bun)

I ran the project build using the Bun runtime. Recommended steps on your machine:

```powershell
# install dependencies with Bun
bun install
# compile TypeScript
bun run build
```

Observed build notes
- I executed `bun install` and `bun run build` in this repository. TypeScript was invoked via `tsc`.
- The build surfaced TypeScript diagnostics in the workspace while compiling. Two notable issues were observed during the run:
  1. TypeScript could not find module declarations for `ethers` (error: "Cannot find module 'ethers' or its corresponding type declarations"). If you encounter this, run:
     ```powershell
     bun add ethers
     # then
     bun run build
     ```
     or install via `npm install` if you prefer.
  2. `packages/react-template/tsconfig.json` references the `vite/client` type and a deprecated `moduleResolution` option; this may produce an informational TypeScript diagnostic. Install the Vite types or adjust the `tsconfig.json` in that package if you plan to compile the template.

Security notes
- Avoid passing secrets on the command line. Prefer environment variables (for example `PRIVATE_KEY`) or an external signer.
- The current `sendPayment` helper expects a raw private key (hex). Consider extending the API to accept a Signer, hardware wallet integration, or a key management provider for production usage.

Next steps and tests
- Add an integration test that starts a local Hardhat node and runs an end-to-end payment using `payment.sendPayment`.
- Consider adding typed wrappers using `ethers.parseUnits` for gas values and stronger validation.

If you'd like, I can (a) run the `bun add ethers` and re-run the build here and fix remaining diagnostics, (b) add the README snippet to the docs site, or (c) scaffold an automated integration test using Hardhat.