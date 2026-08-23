# VX3 SDK — Web3 Developer SDK

VX3 is a developer-first toolkit for building, testing, and shipping Web3
applications. It bundles a CLI, a local development node, a real-time
dashboard, project scaffolding, payment / gas / IPFS helpers, and **VXC**,
an in-house custom Solidity compiler.

Parent repo & docs: <https://github.com/nk4dev/vx3>
SDK docs: <https://nknighta.me/vx>

---

## Highlights

- **One CLI for the whole flow** — scaffold, compile, run a node, pay, estimate
  gas, pin to IPFS, and open a live dashboard.
- **VXC, a custom Solidity compiler** — own frontend (lexer, import resolver,
  artifact pipeline) with a pluggable backend.
  Lives at [`packages/vxc`](packages/vxc/README.md).
- **Real-time dashboard** — `vx3 dash` opens a dark-themed dev dashboard with
  live block number, gas fees, RPC status, and an SSE activity log.
- **Frontend templates** — React and Vue starters, plus a Hardhat package
  pre-wired for VX3 projects.
- **Programmatic APIs** — every CLI command is also exposed as a TypeScript
  function.

## Install

```bash
git clone https://github.com/nk4dev/vx
cd vx
npm i
npm run build
npm link        # exposes the `vx3` binary globally
```

## CLI

```bash
vx3 <command> [...options]
```

| Command | Description |
| --- | --- |
| `init` | Initialize a new project with default settings. |
| `create [name]` | Scaffold a new project (interactive if name omitted). |
| `node` | Start a local development node (port 3000). |
| `dash` | **Open the real-time developer dashboard (port 4000).** |
| `setup hardhat\|react` | Add Hardhat or a React frontend to the current project. |
| `rpc` | Manage or query RPC endpoints from `vx.config.json`. |
| `pay <to> <amount>` | Send a transaction. Flags: `--rpc`, `--key`. |
| `gas` | Estimate gas fees for a transaction. |
| `ipfs` | Pin / fetch content via IPFS. |
| `generate` | Generate templates (react, vue, …). |
| `compile <entry.sol>` | Compile Solidity using the VXC custom compiler. |
| `sol hello` | Solidity helper sample. |
| `info` | Display project / SDK info. |
| `--version`, `-v` | Show SDK version. |
| `help` | Show the help screen. |

### Dashboard (`vx3 dash`)

```bash
vx3 dash                   # http://127.0.0.1:4000
vx3 dash --port 5000       # custom port
vx3 dash --host 0.0.0.0    # bind to all interfaces
vx3 dash --open            # auto-open in browser
```

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
npm run build          # compile TypeScript → dist/
npm test               # jest test suite
npm run lint           # eslint
npm run format         # prettier

# Build the VXC compiler package separately
cd packages/vxc && npx tsc
```

## Contact

[nknighta@varius.technology](mailto:nknighta@varius.technology)

## License

MIT

---
---

# VX3 — Web3 開発者 SDK

VX3 は Web3 アプリケーションの構築・テスト・リリースに必要な機能をまとめた
開発者向けツールキットです。CLI、ローカル開発ノード、リアルタイムダッシュボード、
プロジェクトスキャフォールディング、支払い / ガス / IPFS ヘルパー、
そして独自カスタム Solidity コンパイラ **VXC** を含みます。

親リポジトリ & ドキュメント: <https://github.com/nk4dev/vx3>
SDK ドキュメント: <https://nknighta.me/vx>
日本語ガイド（詳細）: [`docs/ja/guide.md`](docs/ja/guide.md)

---

## 特徴

- **ワークフロー全体を 1 つの CLI で** — スキャフォールド、コンパイル、
  ノード起動、送金、ガス推定、IPFS ピン留め、そしてライブダッシュボード。
- **VXC カスタム Solidity コンパイラ** — 独自フロントエンド（レキサー、
  import リゾルバ、アーティファクトパイプライン）とプラグイン可能なバックエンド。
  [`packages/vxc`](packages/vxc/README.md) に格納。
- **リアルタイムダッシュボード** — `vx3 dash` でダーク UI の開発ダッシュボードを起動。
  ライブブロック番号、ガス料金、RPC ステータス、SSE アクティビティログを表示。
- **フロントエンドテンプレート** — React・Vue スターター、VX3 プロジェクト向け
  Hardhat パッケージを同梱。
- **プログラマティック API** — すべての CLI コマンドは TypeScript 関数としても提供。

## インストール

```bash
git clone https://github.com/nk4dev/vx
cd vx
npm i
npm run build
npm link        # `vx3` バイナリをグローバルに公開
```

## CLI

```bash
vx3 <コマンド> [...オプション]
```

| コマンド | 説明 |
| --- | --- |
| `init` | デフォルト設定で新規プロジェクトを初期化。 |
| `create [name]` | プロジェクトをスキャフォールド（名前省略時は対話モード）。 |
| `node` | ローカル開発ノードを起動（ポート 3000）。 |
| `dash` | **リアルタイム開発ダッシュボードを起動（ポート 4000）。** |
| `setup hardhat\|react` | Hardhat または React フロントエンドを追加。 |
| `rpc` | `vx.config.json` の RPC エンドポイントを管理・参照。 |
| `pay <to> <amount>` | トランザクション送信。オプション: `--rpc`, `--key`。 |
| `gas` | ガス料金を推定。 |
| `ipfs` | IPFS 経由でコンテンツをピン留め / 取得。 |
| `generate` | テンプレートを生成（react, vue など）。 |
| `compile <entry.sol>` | VXC カスタムコンパイラで Solidity をコンパイル。 |
| `sol hello` | Solidity ヘルパーサンプル。 |
| `info` | プロジェクト / SDK 情報を表示。 |
| `--version`, `-v` | SDK バージョンを表示。 |
| `help` | ヘルプ画面を表示。 |

### ダッシュボード（`vx3 dash`）

```bash
vx3 dash                   # http://127.0.0.1:4000
vx3 dash --port 5000       # ポート指定
vx3 dash --host 0.0.0.0    # 全インターフェースにバインド
vx3 dash --open            # ブラウザを自動で開く
```

ダッシュボードのエンドポイント:

| エンドポイント | メソッド | 説明 |
| --- | --- | --- |
| `/` | GET | ダッシュボード HTML |
| `/api/status` | GET | サーバー + RPC ステータス |
| `/api/block` | GET | 最新ブロック番号 |
| `/api/gas` | GET | EIP-1559 ガス料金データ |
| `/api/rpc` | GET | RPC 設定リスト |
| `/events` | GET | SSE ストリーム（ブロック + ガス、4 秒ごと） |

### VXC でコントラクトをコンパイル

```bash
vx3 compile contracts/Token.sol \
  --out build \
  --optimize --runs 1000 \
  --evm cancun \
  --remap @openzeppelin/=node_modules/@openzeppelin/
```

アーティファクト（`<Contract>.json` + `vxc.manifest.json`）は `--out` に出力され、
デプロイ可能な状態で保存されます。
詳細: [`packages/vxc/README.md`](packages/vxc/README.md)

## パッケージ

| パッケージ | パス | 用途 |
| --- | --- | --- |
| `@vx3/vxc` | `packages/vxc` | カスタム Solidity コンパイラ（フロントエンド + プラグイン可能バックエンド）。 |
| `@vx3/hardhat` | `packages/hardhat` | VX3 プロジェクト向け Hardhat 設定プリセット。 |
| `@vx3/template` | `packages/template` | デフォルトプロジェクトテンプレート。 |
| `@vx3/react-template` | `packages/react-template` | React スターター。 |
| `@vx3/vue-template` | `packages/vue-template` | Vue スターター。 |

## 開発

```bash
npm run build          # TypeScript → dist/ にコンパイル
npm test               # jest テストスイート
npm run lint           # eslint
npm run format         # prettier

# VXC コンパイラパッケージを個別にビルド
cd packages/vxc && npx tsc
```

## 連絡先

[nknighta@varius.technology](mailto:nknighta@varius.technology)

## ライセンス

MIT
