---
name: "Copilot タスク"
about: "GitHub Copilot/AI アシスタントでの実装に最適化された課題テンプレート"
title: "[Task] <ここに短い要約>"
labels: ["copilot", "help wanted"]
assignees: []
---

## ゴール（必須）
- 何を達成したいかを1〜3行で。例: 「`vx3 create <name>` で `packages/template` の中身をコピーし、指定名のフォルダを作成できるようにする」

## 背景・文脈
- なぜ必要か、関連チケットや仕様、既知の制約など。
- 参考リンクやスクリーンショットがあれば添付。

## 要件（Acceptance Criteria）
- [ ] 具体的で検証可能な条件を箇条書きで（入出力、振る舞い、エラー時の動作）。
- [ ] CLI ヘルプやドキュメントが更新されている。
- [ ] 既存機能に回帰がないことを確認。

## 変更対象（ファイル/フォルダ、API、CLI）
- 例: `src/command/pjmake.ts`, `src/command/main.ts`, `packages/template/**`

## 実装ガイド（任意：Copilot向けヒント）
- 短い「契約」を書く（入力/出力、成功/失敗、境界条件）。
- 既存コードの依存（型、ユーティリティ、ビルド設定）を明示。
- Windows PowerShell 向けの実行例があると便利。

## テスト計画
- ハッピーパス: 代表ケース1つ。
- エッジ: 空文字/存在するフォルダ/権限エラー/大きなテンプレート。
- 実行例（PowerShell）:
  ```powershell
  npm run build
  node .\dist\src\cli.js create my-app
  Test-Path .\my-app\vx.config.json
  ```

## 追加の制約・非機能要件
- パフォーマンス、互換性、セキュリティ、i18n、ログ/エラー文言など。

## リスク/懸念
- 例: パス解決がビルド/配布形態で異なる（dev と npm publish）。

## 完了の定義（DoD）
- [ ] すべての Acceptance Criteria を満たす。
- [ ] ビルド/テスト/型チェックが PASS。
- [ ] 変更点が README/Docs に反映。

---

### Copilot/AI へのプロンプト例（コピペ可）
> この課題を解決してください。上の要件・変更対象・テスト計画に従い、必要なファイルを編集/追加し、最小限の影響で実装してください。編集後はビルド/簡易テストを実行して結果を共有してください。Windows PowerShell 用の実行コマンドを提示してください。足りない情報がある場合は最小限の仮定を置いて進め、最後に明記してください。

### Notes for English users
- Keep goals and acceptance criteria concise and verifiable.
- List exact files/APIs to touch; Copilot performs best with clear targets.
- Prefer small, iterative changes; run build/lint/tests and paste results.
