# Gemini API 本番環境セキュリティガイド

このドキュメントは、Gemini APIを使用したアプリケーションを本番環境にデプロイする際のセキュリティベストプラクティスをまとめたものです。

## 目次

1. [APIキーの保護](#apiキーの保護)
2. [アーキテクチャ設計](#アーキテクチャ設計)
3. [環境変数の管理](#環境変数の管理)
4. [開発時の注意点](#開発時の注意点)
5. [バックエンド実装例](#バックエンド実装例)
6. [チェックリスト](#本番環境デプロイ前チェックリスト)

---

## APIキーの保護

### ⚠️ 絶対にやってはいけないこと

```javascript
// ❌ 危険: APIキーをコードにハードコーディング
const ai = new GoogleGenAI({apiKey: 'XXXXXXXXXXXX'});

// ❌ 危険: フロントエンド（ブラウザ）でAPIキーを使用
// ブラウザのJavaScriptではAPIキーが必ず露出します
```

### ✅ 正しい方法

```javascript
// ✅ 安全: 環境変数を使用（サーバーサイドのみ）
import 'dotenv/config';
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
```

---

## アーキテクチャ設計

### 推奨アーキテクチャ

```
┌─────────────────────┐
│  フロントエンド      │
│  (ブラウザ)         │  ← APIキーなし
│  - React/Vue/etc    │
└──────────┬──────────┘
           │ HTTP Request (APIキーなし)
           ↓
┌─────────────────────┐
│  バックエンド        │
│  (Node.js/Express)  │  ← APIキーあり (.env)
│  - API Server       │
└──────────┬──────────┘
           │ Gemini API Request (APIキーあり)
           ↓
┌─────────────────────┐
│  Gemini API         │
│  (Google)           │
└─────────────────────┘
```

### なぜバックエンドが必要か

| 実装場所 | セキュリティリスク | 理由 |
|---------|-------------------|------|
| **フロントエンド** | 🔴 高 | ブラウザの開発者ツールでコード・通信内容が見える |
| **バックエンド** | 🟢 低 | APIキーはサーバー内部に保持され、外部から見えない |

---

## 環境変数の管理

### 1. .envファイルの作成

```bash
# .env
GEMINI_API_KEY=your_actual_api_key_here
```

### 2. .gitignoreに追加（必須）

```bash
# .gitignore
.env
.env.local
.env.*.local
```

### 3. 確認方法

```bash
# .envファイルがgit履歴に含まれていないか確認
git log --all --full-history -- '.env'

# 何も出力されなければOK
```

### 4. もし.envをコミットしてしまった場合

```bash
# 1. 新しいAPIキーを発行
# Google AI Studio: https://aistudio.google.com/app/apikey

# 2. 古いAPIキーを削除・無効化

# 3. git履歴から.envを削除（高度な操作）
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

---

## 開発時の注意点

### console.logでのAPIキー露出

```javascript
// ❌ 危険: オブジェクト全体をログ出力
const chat = ai.chats.create({...});
console.log(chat);  // ← APIキーが表示される可能性

// ✅ 安全: 必要な情報のみログ出力
console.log("Chat session created");
```

### 本番環境用の設定

```javascript
// 環境に応じてログレベルを調整
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  console.log("Debug info:", someObject);
}
```

---

## バックエンド実装例

### Express.js サーバーの実装

```javascript
// server.js
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';
import 'dotenv/config';

const app = express();
app.use(express.json({ limit: '50mb' })); // 画像データ用
app.use(cors()); // CORS設定

// Gemini API初期化（サーバー側でのみ）
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 画像生成エンドポイント
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, images, aspectRatio = '5:4', resolution = '1K' } = req.body;

    // リクエストバリデーション
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // contentsの構築
    const contents = [
      { text: prompt },
      ...(images || []).map(img => ({
        inlineData: {
          mimeType: img.mimeType,
          data: img.data
        }
      }))
    ];

    // Gemini API呼び出し
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: contents,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: resolution
        }
      }
    });

    // レスポンス返却（APIキーは含まれない）
    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error generating image:', error);

    // エラーメッセージからAPIキーを除外
    res.status(500).json({
      success: false,
      error: 'Failed to generate image',
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### フロントエンドからの呼び出し

```javascript
// frontend.js
async function generateImage(prompt, images) {
  try {
    const response = await fetch('http://localhost:3000/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        images: images,
        aspectRatio: '5:4',
        resolution: '1K'
      })
    });

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// 使用例
const result = await generateImage(
  'A restaurant group photo of two cats',
  [
    { mimeType: 'image/png', data: base64ImageData1 },
    { mimeType: 'image/png', data: base64ImageData2 }
  ]
);
```

---

## 本番環境デプロイ前チェックリスト

### セキュリティ

- [ ] APIキーが環境変数で管理されている
- [ ] `.env`ファイルが`.gitignore`に含まれている
- [ ] `.env`ファイルがgit履歴に含まれていない
- [ ] 本番環境のAPIキーと開発環境のAPIキーが分離されている
- [ ] CORSが適切に設定されている（許可するオリジンを制限）
- [ ] レート制限が実装されている
- [ ] エラーメッセージにAPIキーが含まれていない

### コード品質

- [ ] `console.log`でAPIキーやセンシティブ情報を出力していない
- [ ] 本番環境では不要なログを削除または無効化している
- [ ] エラーハンドリングが適切に実装されている
- [ ] リクエストバリデーションが実装されている

### インフラ

- [ ] HTTPS通信を使用している
- [ ] 環境変数がサーバーに適切に設定されている
- [ ] ファイアウォール設定が適切
- [ ] APIキーの定期的なローテーションを計画している

### モニタリング

- [ ] APIの使用量をモニタリングしている
- [ ] エラーログを適切に収集・分析している
- [ ] 異常なアクセスパターンを検知できる仕組みがある

---

## 参考リンク

- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Google AI Studio - APIキー管理](https://aistudio.google.com/app/apikey)
- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)

---

## トラブルシューティング

### APIキーがリークした場合

1. **即座にAPIキーを無効化**
   - Google AI StudioまたはCloud Consoleでキーを削除

2. **新しいAPIキーを発行**
   - 新しいキーを生成し、環境変数を更新

3. **リーク元を特定・修正**
   - git履歴、ログファイル、スクリーンショットなどを確認

4. **再発防止策の実施**
   - このドキュメントのチェックリストを再確認

### 本番環境でAPIが動作しない場合

1. 環境変数が正しく設定されているか確認
   ```bash
   echo $GEMINI_API_KEY  # 値が表示されるか確認
   ```

2. APIキーの権限を確認

3. ネットワーク設定（ファイアウォール、プロキシ）を確認

4. エラーログを詳細に確認

---


# API KEY がリークしてしまった時の error コード. 別途 エラー対応の処理を追加する必要があるな
ApiError: {"error":{"code":403,"message":"Your API key was reported as leaked. Please use another API key.","status":"PERMISSION_DENIED"}}
    at throwErrorIfNotOK (file:///Users/snsnap1159/Hiroto/ai_products/gemini_api_demo_0/node_modules/@google/genai/dist/node/index.mjs:12089:30)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async file:///Users/snsnap1159/Hiroto/ai_products/gemini_api_demo_0/node_modules/@google/genai/dist/node/index.mjs:11809:13
    at async Models.generateContent (file:///Users/snsnap1159/Hiroto/ai_products/gemini_api_demo_0/node_modules/@google/genai/dist/node/index.mjs:13152:24)
    at async main (file:///Users/snsnap1159/Hiroto/ai_products/gemini_api_demo_0/src/gemini_image/gemini_image_3.js:54:18) {
  status: 403
}

**最終更新日**: 2026年2月6日
