# VX (VX3) 完全ガイド

> Web3 開発を加速するための CLI & SDK ツールキット

- **更新情報**: https://nknighta.me/vx
- **VX3**: https://nknighta.me/dev/vx3
- **ライセンス**: MIT
- **メンテナ**: [nk4dev](https://nk4dev.github.io/)

> [!WARNING]
> 本プロジェクトは現在開発中です。正式リリース前のバージョンのため、自己責任でご利用ください。

---

## 目次

1. [概要](#概要)
2. [要件](#要件)
3. [インストール](#インストール)
4. [クイックスタート](#クイックスタート)
5. [CLI コマンドリファレンス](#cli-コマンドリファレンス)
6. [設定ファイル（vx.config.json）](#設定ファイルvxconfigjson)
7. [SDK API リファレンス](#sdk-api-リファレンス)
8. [Payment モジュール](#payment-モジュール)
9. [React 支払いコンポーネント](#react-支払いコンポーネント)
10. [IPFS モジュール](#ipfs-モジュール)
11. [Hardhat 連携](#hardhat-連携)
12. [セキュリティのベストプラクティス](#セキュリティのベストプラクティス)
13. [トラブルシューティング](#トラブルシューティング)

---

## 概要

VX（パッケージ名: `@nk4dev/vx`）は、Web3 dApps バックエンドやスクリプト環境を素早く構築するためのツールキットです。

### 主な機能

| 機能 | 説明 |
| :--- | :--- |
| **マルチチェーン接続** | ethers.js v6 を用いた複数チェーンへの RPC 接続 |
| **ウォレット管理** | ウォレットの作成・接続・残高確認 |
| **ETH 送金** | `sendPayment` API による簡単なトランザクション送信 |
| **ガス代監視** | EIP-1559 対応のリアルタイムガス料金取得 |
| **IPFS 連携** | ゲートウェイ経由の CID コンテンツ取得 |
| **ローカル開発サーバ** | デバッグダッシュボード付きの Express サーバ |
| **プロジェクト生成** | テンプレートからの新規プロジェクト作成 |
| **Hardhat 連携** | スマートコントラクト開発環境のスキャフォールディング |
| **React 支払いコンポーネント** | `<Payment>` コンポーネントとフックの自動生成 |

### 使用ライブラリ

| ライブラリ | バージョン | 用途 |
| :--- | :--- | :--- |
| **ethers.js** | v6 | RPC 接続・ブロックチェーン操作 |
| **express** | 最新 | ローカル開発サーバ |
| **minimatch** | v10 | ファイルパターンマッチング |
| **solc** | v0.8 | Solidity コンパイラ |

---

## 要件

- **Node.js**: v18 以上（組み込み `fetch` を使用する場合に必要）
- **パッケージマネージャ**: npm / pnpm / yarn / Bun（いずれも対応）
- **OS**: Windows / macOS / Linux

---

## インストール

### グローバルインストール（CLI として使う場合）

```bash
npm install -g @nk4dev/vx
vx3 --help
```

### ローカルインストール（SDK として使う場合）

```bash
npm install @nk4dev/vx
```

### 開発用（リポジトリをクローンして使う場合）

```powershell
git clone https://github.com/nk4dev/vx.git
cd vx
npm install
npm run build

# シンボリックリンクを作成してグローバルで使えるようにする
npm link
vx3 --help
```

### Bun を使う場合

```powershell
bun install
bun run build
```

> [!NOTE]
> Bun 環境で `ethers` の型エラーが発生した場合は `bun add ethers` を実行してください。

---

## クイックスタート

### 1. 新規プロジェクトを作成する

```powershell
# 対話モード
vx3 create

# 非対話モード（プロジェクト名を直接指定）
vx3 create my-dapp
```

### 2. RPC 設定を初期化する

```powershell
cd my-dapp
vx3 rpc init
```

`vx.config.json` が生成されます。エンドポイントを編集して保存してください。

### 3. ガス代を確認する

```powershell
vx3 gas
```

### 4. ローカル開発サーバを起動する

```powershell
vx3 serve --debug
# http://localhost:3000/debug でダッシュボードを確認
```

---

## CLI コマンドリファレンス

### `vx3 create [name]`

テンプレートから新規 Web3 プロジェクトを作成します。

```powershell
# 対話モード
vx3 create

# 非対話モード
vx3 create my-app
```

`packages/template/` の内容をカレントディレクトリ配下の `<name>/` フォルダにコピーします。`package.json` も自動生成されます。

---

### `vx3 rpc init`

`vx.config.json` の RPC 設定テンプレートを生成します。

```powershell
vx3 rpc init
```

---

### `vx3 gas`

接続中の RPC からガス料金情報を取得して表示します。

```powershell
vx3 gas
```

**出力例:**

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

---

### `vx3 serve [options]`

ローカル開発サーバを起動します。

```powershell
# 通常起動
vx3 serve

# デバッグダッシュボード付きで起動
vx3 serve --debug
```

**エンドポイント:**

| URL | 説明 |
| :--- | :--- |
| `http://localhost:3000/api` | API ルート |
| `http://localhost:3000/api/block` | 最新ブロック番号 |
| `http://localhost:3000/debug` | デバッグダッシュボード（`--debug` 時のみ） |

---

### `vx3 setup hardhat`

現在のプロジェクトに Hardhat 環境をスキャフォールドします。

```powershell
vx3 setup hardhat
# devDependencies を追加でインストール
npm install -D hardhat @nomicfoundation/hardhat-toolbox
```

---

### `vx3 setup react`

React + Vite + TypeScript プロジェクトを Payment コンポーネント付きでスキャフォールドします。

```powershell
vx3 setup react
npm install
npm run dev
```

生成されるファイル:

| ファイル | 説明 |
| :--- | :--- |
| `src/components/Payment.tsx` | 支払い UI コンポーネント |
| `src/components/hooks/use-payment.ts` | `usePayment` フック |
| `src/components/hooks/use-payment-status.ts` | `usePaymentStatus` フック |
| `src/components/hooks/use-payment-dialog.ts` | `usePaymentDialog` フック |
| `src/App.tsx` | デモアプリケーション |
| `vite.config.ts` / `tsconfig.json` | ビルド設定 |

2 つの支払いモードをサポート:
- **`mode="api"`**（デフォルト）: バックエンド API 経由（秘密鍵はサーバー側で管理）
- **`mode="wallet"`**: MetaMask 等のブラウザウォレットで直接署名

```tsx
import { Payment } from './components/Payment';

export default function App() {
  return (
    <Payment
      to="0x1234567890abcdef1234567890abcdef12345678"
      amount="0.01"
      currency="ETH"
      mode="wallet"
      onSuccess={(r) => alert('支払い完了! Tx: ' + r.txHash)}
      onError={(err) => alert('支払い失敗: ' + err.message)}
    />
  );
}
```

> 詳細は [React 支払いコンポーネント](./react-payment.md) を参照してください。

追加されるファイル・スクリプト:

- `hardhat.config.ts`
- `contracts/Sample.sol`
- `scripts/deploy.ts`
- npm スクリプト: `hh`, `hh:compile`, `hh:test`, `hh:node`, `hh:deploy`

```powershell
# ローカルチェーンを起動
npm run hh:node

# コントラクトをコンパイル
npm run hh:compile

# コントラクトをデプロイ
npm run hh:deploy
```

---

### `vx3 pay <to> <amount> [options]`

指定アドレスへ ETH を送金します。

```powershell
# 環境変数で秘密鍵を設定
$env:PRIVATE_KEY = '0x...'

vx3 pay 0xRecipientAddress 0.01 --rpc http://127.0.0.1:8545
```

**オプション:**

| オプション | 説明 |
| :--- | :--- |
| `--rpc <url>` | 使用する RPC URL |

> [!CAUTION]
> 秘密鍵をコマンドライン引数として直接渡さないでください。必ず環境変数（`PRIVATE_KEY`）を使用してください。

---

## 設定ファイル（vx.config.json）

プロジェクトルートに配置する JSON 設定ファイルです。複数の RPC エンドポイントと IPFS ゲートウェイを配列形式で定義します。

### RPC エントリのフィールド

| フィールド | 型 | 説明 |
| :--- | :--- | :--- |
| `type` | `"rpc"` \| `"ipfs"` | エントリの種別（省略時は `"rpc"`） |
| `host` | `string` | ホスト名 |
| `port` | `number` | ポート番号 |
| `protocol` | `"http"` \| `"https"` \| `"ws"` \| `"wss"` | プロトコル |

### IPFS エントリのフィールド

| フィールド | 型 | 説明 |
| :--- | :--- | :--- |
| `type` | `"ipfs"` | 必須。`"ipfs"` を指定 |
| `gateway` | `string` | ゲートウェイ URL（例: `"https://ipfs.io"`） |
| `api.host` | `string` | IPFS API ホスト（任意） |
| `api.port` | `number` | IPFS API ポート（任意） |
| `api.protocol` | `string` | IPFS API プロトコル（任意） |

### 設定例

```json
[
  {
    "host": "localhost",
    "port": 8545,
    "protocol": "http",
    "type": "rpc"
  },
  {
    "host": "rpc.sepolia.example.com",
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

---

## SDK API リファレンス

### インポート方法

#### デフォルトエクスポート（推奨）

```ts
import vx from "@nk4dev/vx";
```

#### 名前付きエクスポート

```ts
import { vx as data, instance, payment } from "@nk4dev/vx";
```

#### CommonJS

```js
const vx = require("@nk4dev/vx").default;
```

---

### `vx.getRpcUrl(): string`

`vx.config.json` から最初の RPC エントリの URL を生成して返します。

```ts
import vx from "@nk4dev/vx";

const rpcUrl = vx.getRpcUrl();
console.log(rpcUrl); // => "http://localhost:8545"
```

---

### `vx.getBlockNumber(rpc: string): Promise<number>`

指定 RPC から最新のブロック番号を取得します。

```ts
import vx from "@nk4dev/vx";

const block = await vx.getBlockNumber("http://localhost:8545");
console.log("Latest block:", block);
```

---

### `vx.getBalance(rpc: string, address: string): Promise<number>`

指定アドレスの ETH 残高を取得します（ETH 単位の浮動小数点数）。

```ts
import vx from "@nk4dev/vx";

const balance = await vx.getBalance(
  "http://localhost:8545",
  "0xYourAddress"
);
console.log("Balance:", balance, "ETH");
```

---

### `vx.getGasFees(rpc: string): Promise<GasFees>`

EIP-1559 対応のガス料金情報を取得します。

```ts
import vx from "@nk4dev/vx";

const fees = await vx.getGasFees("http://localhost:8545");
console.log("Base fee:", fees.baseFeePerGasGwei, "gwei");
console.log("Max fee:", fees.maxFeePerGasGwei, "gwei");
console.log("Priority fee:", fees.maxPriorityFeePerGasGwei, "gwei");
console.log("Gas price (legacy):", fees.gasPriceGwei, "gwei");
```

**`GasFees` 型定義:**

```ts
type GasFees = {
  unit: "gwei" | "wei";
  gasPriceGwei?: string;
  maxFeePerGasGwei?: string;
  maxPriorityFeePerGasGwei?: string;
  baseFeePerGasGwei?: string;
  raw: {
    gasPrice?: bigint | null;
    maxFeePerGas?: bigint | null;
    maxPriorityFeePerGas?: bigint | null;
    baseFeePerGas?: bigint | null;
  };
};
```

> [!NOTE]
> `GasFees` オブジェクトは `toJSON()` メソッドを持ちます。`JSON.stringify()` 使用時の `BigInt` シリアライズエラーを自動的に回避します。

---

### RPC と組み合わせた実用例

```ts
import vx from "@nk4dev/vx";

async function main() {
  const rpc = vx.getRpcUrl();

  const [block, balance, fees] = await Promise.all([
    vx.getBlockNumber(rpc),
    vx.getBalance(rpc, "0xYourAddress"),
    vx.getGasFees(rpc),
  ]);

  console.log(`Block:   ${block}`);
  console.log(`Balance: ${balance} ETH`);
  console.log(`Gas:     ${fees.baseFeePerGasGwei} gwei (base fee)`);
}

main().catch(console.error);
```

---

## Payment モジュール

ETH をプログラムから送金するためのモジュールです。

### `sendPayment(opts: SendPaymentOptions): Promise<SendPaymentResult>`

#### 型定義

```ts
type SendPaymentOptions = {
  rpcUrl: string;                    // 接続する RPC の URL
  privateKey: string;                // 秘密鍵 (hex 文字列)
  to: string;                        // 送金先アドレス
  from?: string;                     // 送金元アドレス（任意）
  amountEth: string;                 // 送金額（ETH 単位、例: "0.01"）
  maxPriorityFeePerGas?: string;     // 優先ガス料金（gwei、任意）
  maxFeePerGas?: string;             // 最大ガス料金（gwei、任意）
  gasLimit?: number;                 // ガスリミット（任意）
};

type SendPaymentResult = {
  txHash: string;    // トランザクションハッシュ
  receipt?: any;     // トランザクションレシート
};
```

#### デフォルトエクスポートから使う

```ts
import vx from "@nk4dev/vx";

const result = await vx.payment.sendPayment({
  rpcUrl: "http://127.0.0.1:8545",
  privateKey: process.env.PRIVATE_KEY!,
  to: "0xRecipientAddress",
  amountEth: "0.01",
});

console.log("Tx hash:", result.txHash);
console.log("Block:", result.receipt?.blockNumber);
```

#### 名前付きエクスポートから使う

```ts
import { payment } from "@nk4dev/vx";

const result = await payment.sendPayment({
  rpcUrl: process.env.RPC_URL!,
  privateKey: process.env.PRIVATE_KEY!,
  to: "0xRecipientAddress",
  amountEth: "0.05",
});
```

#### dotenv を使った送金スクリプト例（scripts/transfer.ts）

```ts
import "dotenv/config";
import vx from "@nk4dev/vx";

async function transfer() {
  const rpcUrl = process.env.RPC_URL ?? vx.getRpcUrl();
  const privateKey = process.env.PRIVATE_KEY;
  const to = process.env.TO_ADDRESS;
  const amountEth = process.env.AMOUNT_ETH ?? "0.01";

  if (!privateKey) throw new Error("PRIVATE_KEY が設定されていません");
  if (!to) throw new Error("TO_ADDRESS が設定されていません");

  console.log(`送金先: ${to}`);
  console.log(`金額: ${amountEth} ETH`);

  const result = await vx.payment.sendPayment({
    rpcUrl,
    privateKey,
    to,
    amountEth,
  });

  console.log("✅ 送金完了");
  console.log("  Tx hash:", result.txHash);
  console.log("  Block:", result.receipt?.blockNumber);
}

transfer().catch((err) => {
  console.error("❌ 送金失敗:", err.message);
  process.exit(1);
});
```

`.env` ファイルの例:

```env
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xabc123...（絶対にコミットしないこと）
TO_ADDRESS=0xRecipientAddress
AMOUNT_ETH=0.01
```

実行方法:

```powershell
npx ts-node scripts/transfer.ts
# または Bun の場合
bun run scripts/transfer.ts
```

> [!CAUTION]
> `sendPayment` は生の秘密鍵（hex）を受け取ります。本番環境では Signer インターフェイス、ハードウェアウォレット、または鍵管理プロバイダーの利用を強く推奨します。

---

## React 支払いコンポーネント

React アプリケーション向けの仮想通貨支払いコンポーネントとフックを提供します。`vx3 setup react` コマンドで自動生成できます。

### セットアップ

```powershell
vx3 setup react
npm install
npm run dev
```

### `<Payment>` コンポーネント

宣言的な支払いフォームコンポーネントです。

```tsx
import { Payment } from './components/Payment';
// または SDK から: import { Payment } from '@nk4dev/vx';

export default function App() {
  return (
    <Payment
      to="0x1234567890abcdef1234567890abcdef12345678"
      amount="0.01"
      currency="ETH"
      mode="wallet"
      onSuccess={(result) => alert('完了! Tx: ' + result.txHash)}
      onError={(err) => alert('失敗: ' + err.message)}
    />
  );
}
```

| Prop | 型 | デフォルト | 説明 |
| :--- | :--- | :--- | :--- |
| `to` | `string` | *必須* | 送金先アドレス |
| `amount` | `string` | *必須* | 送金額（ETH） |
| `currency` | `string` | `"ETH"` | 通貨ラベル |
| `mode` | `"api" \| "wallet"` | `"api"` | 支払いモード |
| `onSuccess` | `(result) => void` | — | 成功時コールバック |
| `onError` | `(error) => void` | — | 失敗時コールバック |

### 支払いモード

- **`mode="api"`**: バックエンド API（`/api/pay`）経由。秘密鍵はサーバー側で管理。
- **`mode="wallet"`**: MetaMask 等のブラウザウォレットで直接署名。秘密鍵不要。

### フック

```tsx
import { usePayment, usePaymentStatus, usePaymentDialog } from './components/hooks';
```

| フック | 説明 |
| :--- | :--- |
| `usePayment()` | 支払い実行関数 `pay()` と状態 `state` を返す |
| `usePaymentStatus()` | トランザクション状態（`idle` / `pending` / `success` / `error`）を追跡 |
| `usePaymentDialog()` | ダイアログの `isOpen` / `open()` / `close()` / `toggle()` を管理 |

#### `usePayment()` の使用例

```tsx
const { pay, state } = usePayment();

const handleDonate = async () => {
  try {
    const result = await pay({ to: '0x...', amount: '0.01', mode: 'wallet' });
    console.log('Tx:', result.txHash);
  } catch (err) {
    console.error(err);
  }
};
```

#### `usePaymentDialog()` の使用例

```tsx
const dialog = usePaymentDialog();

return (
  <>
    <button onClick={dialog.open}>支払う</button>
    {dialog.isOpen && (
      <Payment to="0x..." amount="0.01" mode="wallet" onSuccess={() => dialog.close()} />
    )}
  </>
);
```

> 詳細なドキュメントは [React 支払いコンポーネント](./react-payment.md) を参照してください。

---

## IPFS モジュール

`vx.config.json` に設定された IPFS ゲートウェイからコンテンツを取得します。

### `fetchCid(cid: string, gateway?: string): Promise<{ source: string; data: string | Uint8Array }>`

```ts
import { fetchCid } from "@nk4dev/vx/core/ipfs";

const result = await fetchCid("QmExampleCID");
console.log("Source:", result.source);
console.log("Data:", result.data);
```

`gateway` を省略した場合、`vx.config.json` の最初の `type: "ipfs"` エントリが使用されます。

---

## Hardhat 連携

### セットアップ手順

```powershell
# 1. Hardhat 環境をスキャフォールド
vx3 setup hardhat

# 2. 必要な devDependencies をインストール
npm install -D hardhat @nomicfoundation/hardhat-toolbox

# Bun の場合
bun add -d hardhat @nomicfoundation/hardhat-toolbox
```

### デプロイスクリプト例（scripts/deploy.ts）

```ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Contract = await ethers.getContractFactory("Sample");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();

  console.log("Deployed to:", await contract.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
```

### npm スクリプト

| コマンド | 説明 |
| :--- | :--- |
| `npm run hh:node` | Hardhat ローカルチェーンを起動 |
| `npm run hh:compile` | Solidity コントラクトをコンパイル |
| `npm run hh:test` | テストを実行 |
| `npm run hh:deploy` | コントラクトをデプロイ |

### VX SDK と組み合わせた Hardhat 活用例

```ts
import vx from "@nk4dev/vx";

// Hardhat のローカルノードに接続
const rpc = "http://127.0.0.1:8545";

const block = await vx.getBlockNumber(rpc);
const fees = await vx.getGasFees(rpc);

console.log(`Block: ${block}`);
console.log(`Gas: ${fees.maxFeePerGasGwei} gwei`);
```

---

## セキュリティのベストプラクティス

### 秘密鍵の管理

| 推奨度 | 方法 |
| :--- | :--- |
| ✅ 推奨 | 環境変数（`process.env.PRIVATE_KEY`）+ `.env` ファイル（`.gitignore` 必須） |
| ✅ 推奨 | ハードウェアウォレット（Ledger、Trezor 等） |
| ✅ 推奨 | Signer インターフェイスや鍵管理サービス（AWS KMS 等） |
| ❌ 禁止 | ソースコードへの直書き |
| ❌ 禁止 | コマンドライン引数への直書き |
| ❌ 禁止 | `.env` ファイルをコミットする |

### `.gitignore` に追加すべきファイル

```gitignore
.env
.env.local
.env.*.local
*.key
```

---

## トラブルシューティング

### `ethers` の型エラー（Bun 環境）

```
Cannot find module 'ethers' or its corresponding type declarations
```

**解決策:**

```powershell
bun add ethers
```

または:

```powershell
npm install ethers
```

### `vx.config.json` が見つからない

`getRpcUrl()` などを呼び出す前に、カレントディレクトリに `vx.config.json` が存在することを確認してください。

```powershell
vx3 rpc init
```

### `PRIVATE_KEY` が未設定でエラーになる

```powershell
# Windows (PowerShell)
$env:PRIVATE_KEY = '0x...'

# Linux/macOS
export PRIVATE_KEY='0x...'
```

または `.env` ファイルを作成して `dotenv` でロードしてください。

### `BigInt` のシリアライズエラー

`getGasFees()` の結果を `JSON.stringify()` する場合、`toJSON()` が自動的に呼び出されます。直接 `raw` プロパティを文字列化する場合は手動で変換が必要です。

```ts
const fees = await vx.getGasFees(rpc);
// OK: toJSON() が自動適用される
console.log(JSON.stringify(fees));

// raw の BigInt を変換する場合
const rawGasPrice = fees.raw.gasPrice?.toString();
```

---

## 将来サポート予定

- Vue.js / Svelte / Next.js 向け Payment コンポーネント
- NFT 作成・OpenSea 公開機能
- ウォレット接続ダイアログ（マルチチェーン対応）
- Hardhat を使った統合テスト（E2E）
- より厳密なガス代入力バリデーション

---

*このドキュメントは `@nk4dev/vx` SDK の日本語ガイドです。英語版は [README.md](../README.md) を参照してください。*
