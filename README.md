# VX3 — Web3 Developer SDK

VX3 is a developer-first toolkit for building, testing, and shipping Web3
applications. It bundles a CLI, a local helper API server, a real-time
dashboard, project scaffolding, payment / gas / IPFS helpers, and **VXC**,
an in-house custom Solidity compiler.

Parent repo & docs: <https://github.com/nk4dev/vx3>
SDK docs: <https://nknighta.me/vx>

---

## Highlights

- **One CLI for the whole flow** — scaffold, compile, run a node, pay, estimate
  gas, fetch from IPFS, and open a live dashboard.
- **VXC, a custom Solidity compiler** — own frontend (lexer, import resolver,
  artifact pipeline) with a pluggable backend.
  Lives at [`packages/vxc`](packages/vxc/README.md).
- **Real-time dashboard** — `vx3 dash` opens a dark-themed dev dashboard with
  live block number, gas fees, RPC status, and an SSE activity log.
- **Frontend templates** — React and Vue starters, plus a Hardhat package
  pre-wired for VX3 projects.
- **Programmatic APIs** — every CLI command is also exposed as a TypeScript
  function.
  React component / hooks are also available from `vx3/react`; `react` is an
  optional peer dependency and is only needed when you use them.

## Install

```bash
git clone https://github.com/nk4dev/vx
cd vx
bun i
bun run build
bun link        # exposes the `vx3` binary globally
```

## CLI

```bash
vx3 <command> [...options]
```

| Command | Description |
| --- | --- |
| `init [name]` | Create a project directory (`name`, default `my-vx-project`) from the template. Fails if it exists. |
| `create [name]` | Scaffold a new project (interactive if name omitted). |
| `api` | Start the local helper API server on port 8545. It does **not** run an EVM. Endpoints: `/api`, `/api/block`, `/api/accounts`, `/api/pay` (POST), `/events` (SSE), `/debug` (with `--debug`); they use the RPC in `vx.config.json`. Flags: `--host`, `--port`, `--debug`, `--env`, `--chains`, `--allow-origin <origin>` (lets a frontend dev server call `/api/pay`). (`node` is a deprecated alias.) |
| `dash` | **Open the real-time developer dashboard (port 4000).** |
| `setup hardhat\|react` | Add Hardhat or a React frontend to the current project. |
| `rpc init\|list` | Create a starter `vx.config.json` / show the configured RPC URL. |
| `pay <to> <amount>` | Send a transaction. Flags: `-r/--rpc`, `-k/--key` (prefer the `PRIVATE_KEY` env var), `--json`. |
| `gas` | Show current gas fees from your RPC. Flags: `--rpc`, `--json`. |
| `ipfs fetch <cid> [gateway]` | Fetch content from IPFS by CID (gateway defaults to the one in `vx.config.json`). |
| `mint nft [contract]` | Mint an NFT in one step (`nft mint` is the same command). With no arguments it mints the next token of the project's collection to your own address; the collection is deployed on first use and remembered in `vx.nft.json`. Flags: `--to`, `--uri`, `--name`/`--description`/`--image` (inlined as a `data:` URI), `--id`, `--fn`, `--deploy`, `--collection-name`, `--collection-symbol`, `-r/--rpc`, `-k/--key`, `--json`. See [Minting NFTs](#minting-nfts). |
| `generate template/<react\|vue> [dir]` | Generate a template (`generate list` to list; `--debug` uses the local SDK). Depends on the latest published `vx3` unless `--sdk-version <version>` is given. |
| `compile <entry.sol>` | Compile with VXC. Flags: `-o/--out` (default `artifacts/vxc`), `--optimize`, `--runs` (200), `--evm`, `--base`, `--metadata`, `--remap k=v`. |
| `sol hello` | Solidity helper sample. |
| `info` | Display the remote VX platform version. |
| `--version`, `-v` | Show SDK version. |
| `help` | Show the help screen. |

### Minting NFTs

```bash
npx hardhat node                 # any local dev chain (chain ID 31337 / 1337)

vx3 mint nft                     # deploys a collection on first use, mints #1 to you
vx3 mint nft --name "My NFT" --image https://example.com/a.png
vx3 mint nft --to 0xRecipient --uri ipfs://<cid>
vx3 mint nft 0xExistingContract --uri ipfs://<cid>   # your own ERC-721
```

Everything has a default:

| Needed | Resolved from |
| --- | --- |
| RPC | `--rpc`, then `vx.config.json`, then `http://localhost:8545` |
| Signer | `--key`, then `PRIVATE_KEY` (environment, then `./.env`), then — on a local dev chain only — the node's first account |
| Contract | the address argument, then `vx.nft.json` (per chain ID), then a newly deployed collection |

Outside a local dev chain nothing is deployed and no node account is used
implicitly: pass `--deploy` (costs gas) and a key. The bundled collection
(`contracts/VXCollection.sol`) is a plain ERC-721 whose deployer is the only
minter; token IDs start at 1.

The same thing from code:

```ts
import { quickMint } from 'vx3';

const { tokenId, contractAddress } = await quickMint({
  metadata: { name: 'My NFT', image: 'https://example.com/a.png' },
});
```

`mintNFT()` / `deployNFT()` remain available when you want to pass the RPC URL,
key and contract yourself.

### Dashboard (`vx3 dash`)

```bash
vx3 dash                   # http://127.0.0.1:4000
vx3 dash --port 5000       # custom port
vx3 dash --host 0.0.0.0    # bind to all interfaces
vx3 dash --open            # auto-open in browser
```

> **Note:** `--host 0.0.0.0` exposes the dashboard's `/api/*` endpoints to your
> whole network. There is no authentication, so only do this on a trusted
> network.

Dashboard endpoints:

| Endpoint | Method | Description |
| --- | --- | --- |
| `/` | GET | Dashboard HTML |
| `/api/status` | GET | Server + RPC status |
| `/api/block` | GET | Latest block number |
| `/api/gas` | GET | EIP-1559 gas fee data |
| `/api/rpc` | GET | RPC config list |
| `/events` | GET | SSE stream (block + gas, every 4 s) |

### Compiling contracts with VXC

```bash
vx3 compile contracts/Token.sol \
  --out build \
  --optimize --runs 1000 \
  --evm cancun \
  --remap @openzeppelin/=node_modules/@openzeppelin/
```

Artifacts (`<Contract>.json` + `vxc.manifest.json`) are written to `--out` and
are deploy-ready. Full docs: [`packages/vxc/README.md`](packages/vxc/README.md).

## Packages

| Package | Path | Purpose |
| --- | --- | --- |
| `@vx3/vxc` | `packages/vxc` | Custom Solidity compiler (frontend + pluggable backend). |
| `@vx3/hardhat` | `packages/hardhat` | Hardhat config preset for VX3 projects. |
| `@vx3/template` | `packages/template` | Default project template. |
| `@vx3/react-template` | `packages/react-template` | React starter. |
| `@vx3/vue-template` | `packages/vue-template` | Vue starter. |

## Development

```bash
bun run build           # compile TypeScript → dist/
bun test                # jest test suite
bun run lint             # eslint
bun run format           # prettier

# Build the VXC compiler package separately
cd packages/vxc && npx tsc
```

## Contact

[nknighta@varius.technology](mailto:nknighta@varius.technology)

## License
MIT

## Special notes regarding development
- Nodes created using this SDK are intended solely for development purposes; their use in production environments is not recommended.
