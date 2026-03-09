# React 支払いコンポーネント

CLI コマンド一つで、React アプリケーション向けの仮想通貨支払いコンポーネントを自動生成します。

> [!NOTE]
> この機能は VX3 v0.0.19 で追加されました。

---

## クイックスタート

```bash
# React + Vite プロジェクトを Payment コンポーネント付きでスキャフォールド
vx3 setup react

# 依存関係をインストール
npm install

# 開発サーバを起動
npm run dev
```

以下のファイルを含む、Vite + React + TypeScript プロジェクトが生成されます:

| ファイル | 説明 |
| :--- | :--- |
| `src/components/Payment.tsx` | 支払い UI コンポーネント |
| `src/components/hooks/use-payment.ts` | `usePayment` フック |
| `src/components/hooks/use-payment-status.ts` | `usePaymentStatus` フック |
| `src/components/hooks/use-payment-dialog.ts` | `usePaymentDialog` フック |
| `src/App.tsx` | デモアプリケーション |
| `vite.config.ts` | Vite 設定（API プロキシ付き） |
| `tsconfig.json` | React JSX 用 TypeScript 設定 |

---

## Payment コンポーネント

`<Payment>` コンポーネントは、宣言的で自己完結型の支払いフォームを提供します。

### Props

| Prop | 型 | デフォルト | 説明 |
| :--- | :--- | :--- | :--- |
| `to` | `string` | *必須* | 送金先ウォレットアドレス |
| `amount` | `string` | *必須* | 送金額（ETH 単位） |
| `currency` | `string` | `"ETH"` | 通貨ラベル |
| `mode` | `"api" \| "wallet"` | `"api"` | 支払い通信モード |
| `apiEndpoint` | `string` | `"/api/pay"` | バックエンド API の URL（`mode="api"` 時に使用） |
| `rpcUrl` | `string` | — | バックエンドに渡す RPC URL |
| `onSuccess` | `(result: PaymentResult) => void` | — | 支払い成功時に呼ばれるコールバック |
| `onError` | `(error: Error) => void` | — | 支払い失敗時に呼ばれるコールバック |
| `className` | `string` | — | ルートコンテナに適用する CSS クラス名（任意） |

### 支払いモード

#### `mode="api"`（デフォルト）

バックエンド API エンドポイント（`/api/pay`）に `POST` リクエストを送信します。秘密鍵はサーバー側で管理され、ブラウザに公開されることはありません。

```
ブラウザ  ──POST /api/pay──▶  バックエンド (vx3 serve)  ──eth_sendTransaction──▶  ブロックチェーン
```

#### `mode="wallet"`

ブラウザウォレット（MetaMask 等）に EIP-1193 の `window.ethereum` プロバイダー経由で直接接続します。サーバーも秘密鍵も不要で、ユーザーがウォレット上でトランザクションに署名します。

```
ブラウザ  ──eth_requestAccounts──▶  MetaMask  ──eth_sendTransaction──▶  ブロックチェーン
```

### 基本的な使い方

```tsx
import { Payment } from './components/Payment';

export default function App() {
  return (
    <Payment
      to="0x1234567890abcdef1234567890abcdef12345678"
      amount="0.01"
      currency="ETH"
      mode="wallet"
      onSuccess={(result) => {
        console.log('Tx hash:', result.txHash);
        alert('支払い完了!');
      }}
      onError={(err) => alert('支払い失敗: ' + err.message)}
    />
  );
}
```

### バックエンド API モード

```tsx
<Payment
  to="0x1234..."
  amount="0.05"
  mode="api"
  apiEndpoint="/api/pay"
  rpcUrl="http://127.0.0.1:8545"
  onSuccess={(r) => console.log(r.txHash)}
/>
```

バックエンドには VX3 の組み込み開発サーバ（`vx3 serve`）を使用でき、`/api/pay` エンドポイントが自動的に提供されます。

### Next.js での使用例

```tsx
'use client';

import { Payment } from '@vx3/vx';

export default function PayPage() {
  return (
    <Payment
      to="0x1234567890abcdef1234567890abcdef12345678"
      amount="0.01"
      currency="ETH"
      mode="wallet"
      onSuccess={() => alert('支払い完了!')}
      onError={(err) => alert('支払い失敗: ' + err.message)}
    />
  );
}
```

---

## React フック

より細かい制御が必要な場合のために、3 つのフックを提供しています。

### `usePayment()`

支払いを実行する非同期関数と、リアクティブな状態オブジェクトを返します。

```tsx
import { usePayment } from './components/hooks/use-payment';

function DonateButton() {
  const { pay, state } = usePayment();

  const handleClick = async () => {
    try {
      const result = await pay({
        to: '0x1234...',
        amount: '0.01',
        mode: 'wallet',
      });
      console.log('Tx:', result.txHash);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={state.status === 'pending'}>
        {state.status === 'pending' ? '送信中…' : '0.01 ETH を寄付'}
      </button>
      {state.status === 'error' && <p>エラー: {state.error.message}</p>}
      {state.status === 'success' && <p>送信完了! Tx: {state.txHash}</p>}
    </div>
  );
}
```

**`state` の型（判別共用体）:**

```ts
type PaymentState =
  | { status: 'idle' }
  | { status: 'pending'; txHash?: string }
  | { status: 'success'; txHash: string; receipt?: Record<string, unknown> }
  | { status: 'error'; error: Error };
```

### `usePaymentStatus()`

最新の支払いトランザクションの状態を追跡します。支払いの実行ロジックと状態管理を分離したい場合に便利です。

```tsx
import { usePaymentStatus } from './components/hooks/use-payment-status';

function StatusBanner() {
  const { status, txHash, error, setPending, setSuccess, setError, reset } = usePaymentStatus();

  return (
    <div>
      {status === 'idle' && <p>準備完了</p>}
      {status === 'pending' && <p>処理中…</p>}
      {status === 'success' && <p>完了! Tx: {txHash}</p>}
      {status === 'error' && <p>失敗: {error.message}</p>}
    </div>
  );
}
```

### `usePaymentDialog()`

支払いダイアログやモーダルの開閉状態を管理します。

```tsx
import { usePaymentDialog } from './components/hooks/use-payment-dialog';
import { Payment } from './components/Payment';

function App() {
  const dialog = usePaymentDialog();

  return (
    <div>
      <button onClick={dialog.open}>今すぐ支払う</button>

      {dialog.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ margin: '10vh auto', maxWidth: '32rem' }}>
            <Payment
              to="0x1234..."
              amount="0.01"
              mode="wallet"
              onSuccess={() => dialog.close()}
            />
            <button onClick={dialog.close}>キャンセル</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**戻り値の型:**

```ts
interface PaymentDialogControl {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}
```

---

## SDK からのインポート

VX3 を npm パッケージ（`@vx3/vx`）として使用する場合、コンポーネントとフックを直接インポートできます:

```tsx
import { Payment, usePayment, usePaymentStatus, usePaymentDialog } from '@vx3/vx';
```

### 型のエクスポート

```ts
import type {
  PaymentMode,
  PaymentStatus,
  PaymentResult,
  PaymentOptions,
  PaymentProps,
  PaymentState,
  PaymentDialogControl,
} from '@vx3/vx';
```

---

## CLI リファレンス

### `vx3 setup react`

React + Vite + TypeScript プロジェクトを Payment コンポーネント付きで、カレントディレクトリにスキャフォールドします。

**実行内容:**

1. `package.json` に依存関係とスクリプトを追加
   - **dependencies**: `react`, `react-dom`, `ethers`, `@vx3/vx`
   - **devDependencies**: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`
   - **scripts**: `dev`, `build`, `preview`
2. バンドルされた `packages/react-template/` ディレクトリからテンプレートファイルをコピー

**使い方:**

```bash
# 既存のプロジェクトディレクトリ内で
vx3 setup react

# または新規プロジェクトを作成してから React を追加
vx3 create my-dapp
cd my-dapp
vx3 setup react
npm install
npm run dev
```

---

## スタイリング

生成される Payment コンポーネントは**インライン CSS スタイル**を使用しています。Tailwind などの外部 CSS フレームワークは不要で、そのまま動作します。

外観をカスタマイズするには:

1. `className` prop を渡して独自の CSS を適用する
2. `Payment.tsx` 内のインラインスタイルオブジェクトを直接編集する
3. フックはそのまま利用し、コンポーネントを独自のスタイル付きバージョンに置き換える

---

## アーキテクチャ

```
src/components/
├── Payment.tsx              ← 自己完結型の支払いフォーム
└── hooks/
    ├── index.ts             ← バレルエクスポート
    ├── use-payment.ts       ← 支払い実行ロジック
    ├── use-payment-status.ts ← トランザクション状態追跡
    └── use-payment-dialog.ts ← ダイアログ開閉制御
```

フックは UI から分離されており、任意のコンポーネントライブラリやデザインシステムと組み合わせて使用できます。`Payment.tsx` はリファレンス実装であり、自由にカスタマイズや置き換えが可能です。

---

## セキュリティに関する注意事項

| モード | 秘密鍵の取り扱い |
| :--- | :--- |
| `api` | 秘密鍵はサーバー上に保管（`PRIVATE_KEY` 環境変数）。ブラウザには送信されません。 |
| `wallet` | 秘密鍵は不要。ユーザーが MetaMask 等の互換ウォレットで署名します。 |

> [!CAUTION]
> フロントエンドのコードに秘密鍵をハードコードしないでください。本番 dApps には `mode="wallet"` を使用するか、`mode="api"` でサーバー上に鍵を安全に保管してください。
