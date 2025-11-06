# VX - Web3 Development Toolkit for VX3

Useful web3 development tools for creating projects, connecting to RPCs, checking gas, and running a local dev server.

> [!WARNING]
> This project is in active development and has not yet been officially released. Use at your own risk.

## Project Purpose

VX is a comprehensive Web3 development toolkit designed to simplify and accelerate blockchain development workflows. It provides developers with essential tools for:

- Creating and scaffolding new Web3 projects
- Managing network connections and RPC endpoints across multiple chains
- Monitoring gas prices and blockchain data in real-time
- Local development with an integrated dev server featuring debugging capabilities
- Deploying and compiling smart contracts with Hardhat integration

**Related Resources:**
- Project Master: https://github.com/nk4dev/vx3   
- Documentation: https://nknighta.me/vx   
- VX3 Info: https://nknighta.me/dev/vx3   

**Development Notes:**
This project utilizes code generation AI tools for development:
- GitHub Copilot [GPT-5, Claude sonnet 4, GPT-5 mini, grok code fast]
- Google Gemini
- NotebookLM

## Main Features and Functions

### Core Features
- **Multi-chain Support**: Connect to multiple chains using ethers.js v6
- **Wallet Management**: Create and manage blockchain wallets
- **Local Development Server**: Integrated dev server with simple APIs and debugging capabilities
- **Smart Contract Deployment**: Deploy and compile examples with Hardhat integration included
- **Gas Fee Monitoring**: Real-time gas price information and analysis
- **RPC Management**: Simplified RPC endpoint configuration and switching

### Key Commands
- `vx3 create` - Create new Web3 projects
- `vx3 rpc init` - Initialize RPC configuration
- `vx3 serve --debug` - Start local development server with debug dashboard
- `vx3 gas` - Check current gas fees
- `vx3 setup hardhat` - Scaffold Hardhat files into your project
- `vx3 pay` - Send payments/transactions

## Installation Instructions

### Requirements
- **Node.js:** 18+ (recommended; required for built-in `fetch` usage)
- **Package Manager:** npm, pnpm, or yarn
- **Bun (optional):** For running the project build

### As a Global CLI Tool

Install globally for CLI access from anywhere:
```bash
npm install -g @nk4dev/vx
# or
npm i -g @nk4dev/vx
```

Then use the `vx3` command directly:
```bash
vx3 create my-app
vx3 rpc init
vx3 serve
```

### As a Local Dependency

Install in your project:
```bash
npm install @nk4dev/vx
```

### For One-off Usage (when published)

```bash
npx vx3 <command>
```

### From Source (Development)

Clone and build locally:
```bash
git clone https://github.com/nk4dev/vx.git
cd vx
npm install
npm run build
```

For Bun-based building:
```bash
bun install
bun run build
```

## Quick Start

### Create a New Project
**Non-interactive mode:**
```powershell
vx3 create my-app
```

**Interactive mode:**
```powershell
vx3 create
```

### Initialize RPC Configuration
```powershell
vx3 rpc init
```

### Start Development Server
```powershell
vx3 serve --debug
```

Access the debug dashboard at `http://localhost:3000/debug`

### Check Gas Information
```powershell
vx3 gas
```

## Library Usage (SDK API)

### TypeScript/ESM Import
```ts
import vx from "@nk4dev/vx";

// Get RPC URL from vx.config.json
const rpc = vx.getRpcUrl();

// Query blockchain data
const block = await vx.getBlockNumber(rpc);
const gas = await vx.getGasFees(rpc);
```

### CommonJS Import
```js
const vx = require("@nk4dev/vx").default;
vx.getGasFees("http://127.0.0.1:8545").then(console.log);
```

### Payment Module

Send transactions programmatically:

**TypeScript/ESM:**
```ts
import vx from '@nk4dev/vx';

await vx.payment.sendPayment({
  rpcUrl: 'http://127.0.0.1:8545',
  privateKey: process.env.PRIVATE_KEY!,
  to: '0xRecipientAddress',
  amountEth: '0.01'
});
```

**CLI Usage:**
```powershell
$env:PRIVATE_KEY='0x...'
vx3 pay 0xRecipientAddress 0.01 --rpc http://127.0.0.1:8545
```

> ⚠️ **Security Warning**: Never pass secrets directly on the command line. Always use environment variables or external signers for production use.

## Project Structure

### Project Creation (Template Copy)
`vx3 create <name>` recursively copies the contents of `packages/template` to the destination folder.

Template includes:
- `sample.js` - Sample JavaScript file
- `sample.sol` - Sample Solidity contract
- `vx.config.json` - Configuration template
- `contracts/Sample.sol` - Sample smart contract

### Template Directory Resolution
Searches in order:
1. When running `dist`: `../../packages/template`
2. When running TS/config: `../../../packages/template`
3. From repository: `<cwd>/packages/template`

## RPC Configuration

The `vx.config.json` file stores RPC and gateway endpoints in an array. Each entry supports either a standard RPC endpoint (http/https/ws/wss) or an IPFS gateway entry.

Supported fields:
- `type` (optional): `rpc` (default) or `ipfs`.
- For RPC entries: `host`, `port`, `protocol` (one of `http`/`https`/`ws`/`wss`).
- For IPFS entries: either `gateway` (a public gateway URL) or an `api` object with `host`, `port`, and `protocol`.

Example `vx.config.json` with HTTP, HTTPS and IPFS entries:

```json
[
  {
    "host": "localhost",
    "port": 8575,
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

Generate template with: `vx3 rpc init` (the CLI will create a starter `vx.config.json` in the current directory).

## Development Features

### Debug Dashboard
Run `vx3 serve --debug` to access the TailwindCSS-powered debug dashboard at `/debug`:
- Server host and latest block number
- Quick API links and example fetch calls
- Real-time blockchain data

### Hardhat Setup
Scaffold Hardhat files into your project:
```powershell
vx3 setup hardhat
npm install  # Install dev dependencies
```

## Dependencies

- **express** - Debug and local development server
- **ethers.js** - RPC and blockchain operations

## Future UI Framework Support

Planned support for:
- React
- Vue.js
- Svelte
- Next.js

## Author

Maintainer: [nk4dev](https://nk4dev.github.io/)

## License

MIT License © nk4dev

This project is licensed under the MIT License. See the LICENSE file for details.
