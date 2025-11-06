# VX - VX3 向け Web3 開発ツールキット

便利な Web3 開発ツール群です。プロジェクト作成、RPC への接続、ガス確認、ローカル開発サーバの起動などをサポートします。

> 注意: 本プロジェクトは開発中であり、まだ正式リリースされていません。自己責任でご利用ください。

アップデート: https://nknighta.me/vx
vx3: https://nknighta.me/dev/vx3

本プロジェクトはコード生成 AI ツールを一部で使用しています。
- GitHub Copilot
- Google Gemini
- NotebookLM

## 機能
- 複数チェーンへの接続（ethers v6）
- ウォレットの作成と管理
- シンプルな API を提供するローカル開発サーバ
- デプロイ／コンパイルの例（Hardhat サンプルを同梱）

## 要件
- Node.js 18+（推奨。組み込み fetch を使用する場合は必要）
- npm（または pnpm / yarn）

## 開発用インストール
```powershell
npm install
npm run build
# ビルド後の CLI を実行
node .\dist\src\cli.js --help
```

ローカル検証用にシンボリックリンクする方法:
```powershell
npm link
vx3 --help
```

公開後に一時的に使う場合: `npx vx3 <command>`

## クイックスタート
- 新規プロジェクト作成（非対話）:
```powershell
vx3 create my-app
```
- 新規プロジェクト作成（対話）:
```powershell
vx3 create
```
- RPC 設定テンプレート初期化:
```powershell
vx3 rpc init
```
- ローカル開発サーバ起動（デバッグ表示付き）:
```powershell
vx3 serve --debug
```
- ガス情報の確認:
```powershell
vx3 gas
```

## ライブラリとしての利用（インポート）
デフォルトエクスポートでプログラムから SDK を利用できます。CLI 機能はそのまま利用可能です。

TypeScript/ESM:
```ts
import vx from "@nk4dev/vx";

const rpc = vx.getRpcUrl(); // vx.config.json から読み取る
const block = await vx.getBlockNumber(rpc);
const gas = await vx.getGasFees(rpc);
```

CommonJS:
```js
const vx = require("@nk4dev/vx").default;
vx.getGasFees("http://127.0.0.1:8545").then(console.log);
```

後方互換のための名前付きエクスポートも利用可能です:
```ts
import { vx as data, instance } from "@nk4dev/vx";
await data.getBalance("http://127.0.0.1:8545", "0x...");
```

## プロジェクト作成（テンプレートコピー）
`vx3 create <name>`（または `vx3 init <name>`）はリポジトリ内の `packages/template` の内容を再帰的にコピーして、カレントディレクトリ直下に `<name>` フォルダを作成します。`package.json` も生成されます。

テンプレートの例:
- `packages/template/sample.js`
- `packages/template/sample.sol`
- `packages/template/vmx.config.json`
- `packages/template/contracts/Sample.sol`

テンプレート検索の候補（開発／配布時の差を吸収するため複数候補を検索します）:
1) dist 実行時: `../../packages/template`
2) TS 実行時: `../../../packages/template`
3) リポジトリ直下: `<cwd>/packages/template`

見つからない場合は警告を発して最小限のセット（`package.json` のみ）を作成します。

## Hardhat セットアップ
ローカルプロジェクトに Hardhat ファイルをスキャフォールドします:

```powershell
vx3 setup hardhat
# その後 devDependencies を追加
npm install -D hardhat @nomicfoundation/hardhat-toolbox

# 例: スクリプトを試す
npm run hh:node
npm run hh:compile
npm run hh:deploy
```

このコマンドは:
- スクリプト（`hh`, `hh:compile`, `hh:test`, `hh:node`, `hh:deploy`）を追加／マージします
- devDependencies に `hardhat`, `@nomicfoundation/hardhat-toolbox` を追加します
- 利用可能ならテンプレートをコピーします:
	- `hardhat.config.ts`
	- `contracts/Sample.sol`
	- `scripts/deploy.ts`

## RPC 設定（vx.config.json）

`vx3 rpc init` は RPC 設定のテンプレートを作成します。`vx.config.json` は配列形式で複数のエンドポイントを定義できます。

各エントリは標準の RPC（http/https/ws/wss）または IPFS のゲートウェイを表現できます。主なフィールド:
- `type` (省略可): `rpc`（デフォルト）または `ipfs`
- RPC: `host`, `port`, `protocol` (`http`/`https`/`ws`/`wss`)
- IPFS: `gateway`（例: `https://ipfs.io`）または `api` オブジェクト（`host`/`port`/`protocol`）

例:

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

CLI でテンプレートを生成するには:

```powershell
vx3 rpc init
```

## デバッグページ（Tailwind UI）
`vx3 serve --debug` は TailwindCSS ベースのデバッグダッシュボードを `/debug` に提供します:
- サーバホストと最新ブロック番号の表示
- クイックリンク: `/api`, `/api/block`
- 使用例（fetch）のセクション

### ガスコマンドの例出力
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

## 使用ライブラリ
- express（デバッグ／ローカルサーバ）
- ethers.js（RPC／ブロックチェーン操作）

## 将来サポート予定の UI フレームワーク
- React
- Vue.js
- Svelte
- Next.js

## 作者
メンテナ: [nk4dev](https://nk4dev.github.io/)

## 支払いモジュール — API と CLI（Bun ランタイム）

このリポジトリには、CLI とプログラムの両方から利用できる再利用可能な支払いモジュールが追加されました。

追加された内容
- `src/payment/index.ts` — `sendPayment(options)` をエクスポートするヘルパー
- `src/command/pay.ts` — `sendPayment` を呼び出す CLI ラッパー
- `src/index.ts` — ライブラリエントリが `payment` 名前空間を公開します（`vx.payment.sendPayment(...)` または `import { payment } from '@nk4dev/vx'`）

プログラムからの使い方

TypeScript/ESM 例:
```ts
import vx from '@nk4dev/vx';

await vx.payment.sendPayment({
	rpcUrl: 'http://127.0.0.1:8545',
	privateKey: process.env.PRIVATE_KEY!,
	to: '0xRecipientAddressHere',
	amountEth: '0.01'
});
```

名前付きインポート:
```ts
import { payment } from '@nk4dev/vx';
await payment.sendPayment({ rpcUrl, privateKey, to, amountEth: '0.01' });
```

CLI の使い方（推奨: 環境変数で秘密鍵を渡す）:
```powershell
#$env:PRIVATE_KEY='0x...'
vx3 pay 0xRecipientAddress 0.01 --rpc http://127.0.0.1:8545
```

実行／ビルド（Bun を使用）

このリポジトリでは Bun ランタイムを使ってビルドを試行しました。ローカル環境での推奨手順:

```powershell
# Bun を使って依存をインストール
bun install
# TypeScript をビルド
bun run build
```

ビルド時の観察事項
- `bun install` と `bun run build` を実行した際、TypeScript の診断がいくつか出ました。
- 主な指摘:
	1. `ethers` の型宣言が見つからないというエラー（"Cannot find module 'ethers' or its corresponding type declarations"）。解決策:
		 ```powershell
		 bun add ethers
		 bun run build
		 ```
		 または `npm install ethers` を利用してください。
	2. `packages/react-template/tsconfig.json` が `vite/client` の型を参照している、また `moduleResolution` の非推奨設定があるため、情報的な診断が出ることがあります。テンプレートをコンパイルする場合は Vite の型を追加するか tsconfig を修正してください。

セキュリティ上の注意
- 秘密情報をコマンドラインで渡すのは避けてください。環境変数（例: `PRIVATE_KEY`）や外部署名者の利用を推奨します。
- 現在の `sendPayment` は生のプライベートキー（hex）を受け取ります。本番では Signer やハードウェアウォレット、キー管理プロバイダーに対応することを検討してください。

今後の作業案
- Hardhat のローカルノードを起動して E2E テスト（`payment.sendPayment` の統合テスト）を追加する。
- ガス値処理に `ethers.parseUnits` を使った型付きラッパーや、より厳密な入力検証を追加する。

必要であれば、私の方で `(a)` ここで `bun add ethers` を実行してビルドを再実行して残りの診断を修正、`(b)` README のスニペットを docs サイトに追加、または `(c)` Hardhat を使った統合テストを生成できます。

