# TEPPEN-ENGLISH

BASE CAMP English モバイルアプリ（React Native / Expo Router）

- 仕様書: `docs/teppen-english-spec.md`
- 画面設計プロトタイプ: 別リポジトリ `BASECAMP_design/index.html`

## 開発環境

ローカル(WSL2)のメモリ制約を避けるため、依存関係インストール・Metroバンドラーの起動はAWS EC2上（Tokyoリージョン, `teppen-english-dev`インスタンス）で実行しています。コード編集はローカルで行い、`rsync`でEC2に同期して起動確認します。

```bash
# EC2へ同期
rsync -az --exclude node_modules --exclude .git \
  -e "ssh -i ~/.ssh/teppen-english-dev-key.pem" \
  ./ ubuntu@<EC2_PUBLIC_IP>:~/TEPPEN-ENGLISH/

# EC2上で起動（Expo Goアプリでトンネル接続）
ssh -i ~/.ssh/teppen-english-dev-key.pem ubuntu@<EC2_PUBLIC_IP>
cd ~/TEPPEN-ENGLISH && npx expo start --tunnel
```

## 実装ロードマップ

1. 基盤構築（ナビゲーション・デザインシステム）
2. 起動〜初回導線（splash/auth/オンボーディング）
3. ホーム（標高カード・登頂ギミック）
4. トレーニングHub
5. ミッションHub
6. MYフレーズ
7. 記録
8. トーク
9. マイページ
10. 全体統合・磨き込み
11. （将来）AI添削・STT・TTS・WebRTC通話・ランキングAPIなど実バックエンド接続
