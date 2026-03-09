# SDK API リファレンス

VX3 SDK をプログラムからインポートして利用する方法を解説します。

## インポート方法

### デフォルトエクスポート（推奨）

```ts
import vx from "@vx3/vx";
```

`vx` オブジェクトには以下のメソッド・プロパティが含まれます:

| プロパティ | 説明 |
| :--- | :--- |
| `vx.getRpcUrl()` | `vx.config.json` から RPC URL を取得 |
| `vx.getBlockNumber(rpc)` | 最新ブロック番号を取得 |
| `vx.getBalance(rpc, address)` | アドレスの残高を取得 (ETH) |
| `vx.getGasFees(rpc)` | ガス料金情報を取得 |
| `vx.payment` | Payment モジュール |
| `vx.data` | Data モジュール (全関数を含む) |
| `vx.instance` | レガシー互換 |

### 名前付きエクスポート

```ts
import { vx as data, instance, payment } from "@vx3/vx";
```

### CommonJS

```js
const vx = require("@vx3/vx").default;
```

---

## データ取得 API

### `getBlockNumber(rpc: string): Promise<number>`

指定した RPC から最新のブロック番号を取得します。

```ts
import vx from "@vx3/vx";

const blockNumber = await vx.getBlockNumber("http://localhost:8545");
console.log("Latest block:", blockNumber);
```

### `getBalance(rpc: string, address: string): Promise<number>`

指定アドレスの ETH 残高を取得します（ETH 単位の浮動小数点数）。

```ts
const balance = await vx.getBalance(
  "http://localhost:8545",
  "0xYourAddress"
);
console.log("Balance:", balance, "ETH");
```

### `getGasFees(rpc: string): Promise<GasFees>`

EIP-1559 対応のガス料金情報を取得します。

```ts
const fees = await vx.getGasFees("http://localhost:8545");
console.log("Base fee:", fees.baseFeePerGasGwei, "gwei");
console.log("Max fee:", fees.maxFeePerGasGwei, "gwei");
console.log("Priority fee:", fees.maxPriorityFeePerGasGwei, "gwei");
console.log("Gas price (legacy):", fees.gasPriceGwei, "gwei");
```

**`GasFees` 型:**

```ts
type GasFees = {
  unit: 'gwei' | 'wei';
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
> `GasFees` オブジェクトは `toJSON()` メソッドを持ち、`BigInt` のシリアライズエラーを回避します。

### `getRpcUrl(): string`

カレントディレクトリの `vx.config.json` から RPC URL を構築して返します。

```ts
const rpcUrl = vx.getRpcUrl();
// => "http://localhost:8545"
```

---

## Payment モジュール

ETH 送金トランザクションを送信するためのモジュールです。

### `sendPayment(opts: SendPaymentOptions): Promise<SendPaymentResult>`

```ts
import vx from "@vx3/vx";

const result = await vx.payment.sendPayment({
  rpcUrl: "http://127.0.0.1:8545",
  privateKey: process.env.PRIVATE_KEY!,
  to: "0xRecipientAddress",
  amountEth: "0.01",
});

console.log("Tx hash:", result.txHash);
console.log("Block:", result.receipt?.blockNumber);
```

**`SendPaymentOptions` 型:**

```ts
type SendPaymentOptions = {
  rpcUrl: string;            // RPC URL
  privateKey: string;        // 秘密鍵 (hex)
  to: string;                // 送信先アドレス
  from?: string;             // 送信元アドレス (任意)
  amountEth: string;         // 送金額 (ETH, 例: "0.01")
  maxPriorityFeePerGas?: string;  // gwei (任意)
  maxFeePerGas?: string;          // gwei (任意)
  gasLimit?: number;               // ガスリミット (任意)
};
```

**`SendPaymentResult` 型:**

```ts
type SendPaymentResult = {
  txHash: string;      // トランザクションハッシュ
  receipt?: any;       // トランザクションレシート
};
```

### 名前付きインポート

```ts
import { payment } from "@vx3/vx";

await payment.sendPayment({ rpcUrl, privateKey, to, amountEth: "0.01" });
```

> [!CAUTION]
> `sendPayment` は生の秘密鍵を受け取ります。本番環境では Signer やハードウェアウォレットの利用を検討してください。

---

## IPFS モジュール

`vx.config.json` に設定された IPFS ゲートウェイからコンテンツを取得します。

### `fetchCid(cid: string, gateway?: string): Promise<{source: string, data: string | Uint8Array}>`

```ts
import { fetchCid } from "@vx3/vx/core/ipfs";

const result = await fetchCid("QmExampleCID");
console.log("Source:", result.source);
console.log("Data:", result.data);
```

---

## 使用ライブラリ

| ライブラリ | バージョン | 用途 |
| :--- | :--- | :--- |
| **ethers.js** | v6 | RPC 接続・ブロックチェーン操作 |
| **minimatch** | v10 | ファイルパターンマッチング |
| **solc** | v0.8 | Solidity コンパイラ |

---

## React 支払いコンポーネント

React 向けの Payment コンポーネントとフックを提供しています。

### インポート

```tsx
import { Payment, usePayment, usePaymentStatus, usePaymentDialog } from '@vx3/vx';
```

### `<Payment>` コンポーネント

```tsx
<Payment
  to="0x1234567890abcdef1234567890abcdef12345678"
  amount="0.01"
  currency="ETH"
  mode="wallet"
  onSuccess={(result) => console.log(result.txHash)}
  onError={(err) => console.error(err)}
/>
```

| Prop | 型 | デフォルト | 説明 |
| :--- | :--- | :--- | :--- |
| `to` | `string` | *必須* | 送金先アドレス |
| `amount` | `string` | *必須* | 送金額（ETH） |
| `currency` | `string` | `"ETH"` | 通貨ラベル |
| `mode` | `"api" \| "wallet"` | `"api"` | `"api"`: バックエンド経由 / `"wallet"`: MetaMask 直接 |
| `onSuccess` | `(result) => void` | — | 支払い成功時コールバック |
| `onError` | `(error) => void` | — | 支払い失敗時コールバック |

### フック

| フック | 説明 |
| :--- | :--- |
| `usePayment()` | 支払いを実行する非同期関数と状態を返す |
| `usePaymentStatus()` | トランザクション状態を追跡 |
| `usePaymentDialog()` | ダイアログの開閉状態を管理 |

> 詳細は [React 支払いコンポーネント](./react-payment.md) を参照してください。

### CLI によるセットアップ

```bash
vx3 setup react
npm install
npm run dev
```
