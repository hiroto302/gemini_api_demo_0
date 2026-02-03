/* 画像生成サンプルコード
こちらには、https://ai.google.dev/gemini-api/docs/image-generation?hl=ja の画像生成（テキスト画像変換）のサンプルコードを実演しています。


* 1. if (part.text) の役割
実は エラー専用ではありません。Gemini の画像生成モデルは、以下のような複数のパターンで返答します：

パターン1: 画像のみ
  parts: [
    { inlineData: {...}, thoughtSignature: "..." }
  ]

パターン2: 画像 + 説明文
  parts: [
    { text: "Here's a nano banana dish in a Gemini-themed restaurant" },
    { inlineData: {...}, thoughtSignature: "..." }
  ]

パターン3: エラー時（安全性フィルター）
  parts: [
    { text: "I cannot generate this image due to safety concerns" }
  ],
finishReason: 'SAFETY'  // ← これでエラーと判断
なので、if (part.text) は テキストがあれば表示 という汎用的な処理を実装しています。


* 2. Buffer 変換の流れ
const imageData = part.inlineData.data;
↓ imageData = "/9j/4AA...fP1" (Base64文字列、約83万文字)

const buffer = Buffer.from(imageData, "base64");
↓ buffer = <Buffer ff d8 ff e0 00 10 ...> (バイナリデータ)
なぜ変換が必要？

API はネットワーク越しにテキストしか送れない
画像 → Base64（テキスト化） → 送信 → Base64 → バイナリ（元に戻す） → ファイル保存
Buffer とは：
  Node.js の組み込みクラスで、バイナリデータ（画像、動画、音声など）を扱うためのもの。


* 3. fs とは
fs = File System（ファイルシステム）
Node.js の 標準モジュール（追加インストール不要）で、ファイル操作を行います。

import * as fs from "node:fs";
node: プレフィックスの意味：
  Node.js 12+ で導入された新しい記法
  「これは Node.js の組み込みモジュールです」と明示
  npm install したパッケージと区別するため

fs でできること：
  fs.readFileSync() - ファイル読み込み
  fs.writeFileSync() - ファイル書き込み
  fs.existsSync() - ファイル存在確認
  fs.unlinkSync() - ファイル削除
*/


import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import 'dotenv/config';

async function main() {

  const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

  const prompt =
    "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme";

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: prompt,
  });
  console.log(response);
  console.log(response.candidates[0].content);
  console.log(response.candidates[0].content.parts[0].inlineData);

  // Save the image from the response
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("gemini-native-image.png", buffer);
      console.log("Image saved as gemini-native-image.png");
    }
  }
}

main();

/* リスポンス実行結果
GenerateContentResponse {
  sdkHttpResponse: {
    headers: {
      'alt-svc': 'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000',
      'content-encoding': 'gzip',
      'content-type': 'application/json; charset=UTF-8',
      date: 'Tue, 03 Feb 2026 14:56:12 GMT',
      server: 'scaffolding on HTTPServer2',
      'server-timing': 'gfet4t7; dur=18801',
      'transfer-encoding': 'chunked',
      vary: 'Origin, X-Origin, Referer',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'SAMEORIGIN',
      'x-xss-protection': '0'
    }
  },
  candidates: [ { content: [Object], finishReason: 'STOP', index: 0 } ],
  modelVersion: 'gemini-3-pro-image-preview',
  responseId: 'jAyCaciAJq7s1e8Ppo32wAc',
  usageMetadata: {
    promptTokenCount: 17,
    candidatesTokenCount: 1224,
    totalTokenCount: 1480,
    promptTokensDetails: [ [Object] ],
    candidatesTokensDetails: [ [Object] ],
    thoughtsTokenCount: 239
  }
}
*/

/* esponse.candidates[0].content 結果の内容
{
parts: [
    {
      inlineData: [Object],
      thoughtSignature: 'EufVQgrj1UIBcsjafBS3bNc2...省略...base64...の記述'
          }
  ],
  role: 'model'
}
Image saved as gemini-native-image.png

* thoughtSignature についてもう少し詳しく
Gemini の推論プロセスの検証用データ
Gemini 3 の推論モデル（特に Flash/Pro）は、回答を生成する前に内部的な「思考」を行います。この思考プロセスは：
usageMetadata: {
  thoughtsTokenCount: 239  // ← この思考に使われたトークン数
}
thoughtSignature の具体的な用途：
  検証: この回答がどのような思考プロセスを経たかの署名
  監査: 後から思考の妥当性をトレース
  デバッグ: Google内部で推論の品質管理
  不正防止: 思考プロセスの改ざん検出

  Base64 エンコードされた暗号化データなので、開発者が直接解読することはできません。
  Google のシステム内部でのみ使用されます。

* inlineData
バイナリデータ（画像、音声、動画など）をレスポンスに含める際の形式
*/

/* response.candidates[0].content.parts[0].inlineData の実行結果
{
  mimeType: 'image/jpeg',
  data: '/9j/4AA....base64...省略...fP1'... 832244 more characters
}'
*/